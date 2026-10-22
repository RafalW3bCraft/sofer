import type { Question } from "../../../shared/schemas";

export type GradingResult =
  | {
      kind: "correct";
      explanation: string;
    }
  | {
      kind: "incorrect";
      explanation: string;
      correctIndex: 0 | 1 | 2 | 3;
    };

export function gradeAnswer(
  question: Question,
  selectedIndex: number
): GradingResult {
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex > 3) {
    throw new Error("gradeAnswer: selectedIndex must be 0..3");
  }
  if (selectedIndex === question.correctIndex) {
    return { kind: "correct", explanation: question.correctExplanation };
  }
  const incorrectSlots = ([0, 1, 2, 3] as const).filter(
    (i) => i !== question.correctIndex
  );
  const slot = incorrectSlots.indexOf(selectedIndex as 0 | 1 | 2 | 3);
  const explanation =
    slot >= 0
      ? question.incorrectExplanations[slot] ?? question.correctExplanation
      : question.correctExplanation;
  return {
    kind: "incorrect",
    explanation,
    correctIndex: question.correctIndex,
  };
}