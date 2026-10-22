import { describe, expect, it } from "vitest";
import { gradeAnswer } from "../../client/src/lib/grading";
import type { Question } from "../../shared/schemas";

const baseQuestion: Question = {
  prompt: "Pick the right one.",
  options: ["A", "B", "C", "D"],
  correctIndex: 0,
  correctExplanation: "Because A is correct.",
  incorrectExplanations: ["A is wrong because…", "C is wrong because…", "D is wrong because…"],
};

describe("gradeAnswer", () => {
  it("returns correct for the right answer", () => {
    const result = gradeAnswer(baseQuestion, 0);
    expect(result.kind).toBe("correct");
    if (result.kind === "correct") {
      expect(result.explanation).toBe("Because A is correct.");
    }
  });

  it("returns incorrect with the matched explanation for an incorrect pick", () => {
    const result = gradeAnswer(baseQuestion, 1);
    expect(result.kind).toBe("incorrect");
    if (result.kind === "incorrect") {
      expect(result.explanation).toBe("A is wrong because…");
      expect(result.correctIndex).toBe(0);
    }
  });

  it("maps each incorrect option to its own explanation", () => {
    expect(gradeAnswer(baseQuestion, 1)).toMatchObject({ explanation: "A is wrong because…" });
    expect(gradeAnswer(baseQuestion, 2)).toMatchObject({ explanation: "C is wrong because…" });
    expect(gradeAnswer(baseQuestion, 3)).toMatchObject({ explanation: "D is wrong because…" });
  });

  it("rejects out-of-range indices", () => {
    expect(() => gradeAnswer(baseQuestion, -1)).toThrow();
    expect(() => gradeAnswer(baseQuestion, 4)).toThrow();
    expect(() => gradeAnswer(baseQuestion, 1.5)).toThrow();
  });
});