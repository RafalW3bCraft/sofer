import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  LessonsFileSchema,
  tokenId,
} from "../../shared/schemas";

const lessonsPath = resolve("client/src/content/lessons.json");
const raw = JSON.parse(readFileSync(lessonsPath, "utf8"));
const data = LessonsFileSchema.parse(raw);

describe("lessons.json", () => {
  it("preserves the original lesson IDs and supports the expanded candidate pack", () => {
    const total = data.lessons.reduce((n, l) => n + l.sentences.length, 0);
    expect(total).toBe(48);
    expect(data.lessons.slice(0, 3).map((lesson) => lesson.id)).toEqual([
      "greetings-1", "numbers-1", "directions-1",
    ]);
  });

  it("has 12 lessons, with additions clearly marked as draft", () => {
    expect(data.lessons.length).toBe(12);
    expect(data.lessons.filter((lesson) => lesson.reviewStatus !== "draft").length).toBe(3);
    expect(data.lessons.filter((lesson) => lesson.reviewStatus === "draft").length).toBe(9);
  });

  it("accepts expanded A1 topics and draft lessons with more than three sentences", () => {
    const lesson = data.lessons[0]!;
    const expanded = {
      version: 2,
      lessons: [{
        ...lesson,
        id: "food-1",
        topic: "food",
        reviewStatus: "draft",
        prerequisites: [lesson.id],
        vocabularyRefs: ["food:water"],
        grammarRefs: ["present-tense"],
        sentences: Array.from({ length: 4 }, (_, i) => ({
          ...lesson.sentences[i % lesson.sentences.length]!,
          id: `food-s${i + 1}`,
        })),
      }],
    };
    expect(LessonsFileSchema.safeParse(expanded).success).toBe(true);
  });

  it("every token's arabic substring matches the offsets", () => {
    for (const lesson of data.lessons) {
      for (const sentence of lesson.sentences) {
        for (const token of sentence.tokens) {
          const slice = sentence.arabic.slice(token.start, token.end);
          expect(slice).toBe(token.arabic);
        }
      }
    }
  });

  it("every question has 4 options and a valid correctIndex", () => {
    for (const lesson of data.lessons) {
      for (const sentence of lesson.sentences) {
        expect(sentence.question.options.length).toBe(4);
        expect(sentence.question.correctIndex).toBeGreaterThanOrEqual(0);
        expect(sentence.question.correctIndex).toBeLessThanOrEqual(3);
        expect(sentence.question.incorrectExplanations.length).toBe(3);
      }
    }
  });

  it("tokenId produces the expected stable id", () => {
    expect(tokenId("greetings-1", "g1-s1", 0)).toBe("greetings-1:g1-s1:0");
  });
});
