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
  it("contains exactly 7 sentences across the lessons", () => {
    const total = data.lessons.reduce((n, l) => n + l.sentences.length, 0);
    expect(total).toBe(7);
  });

  it("has 3 lessons", () => {
    expect(data.lessons.length).toBe(3);
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