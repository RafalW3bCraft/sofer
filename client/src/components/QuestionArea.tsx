import { useState } from "react";
import type { Question } from "../../../shared/schemas";
import { gradeAnswer, type GradingResult } from "../lib/grading";
import { annotateArabic } from "../lib/annotateArabic";

interface Props {
  question: Question;
  onSubmit: (selectedIndex: number) => void;
  onAdvance: () => void;
  isLast: boolean;
}

export default function QuestionArea({
  question,
  onSubmit,
  onAdvance,
  isLast,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<GradingResult | null>(null);

  const handleSubmit = () => {
    if (selected === null) return;
    const r = gradeAnswer(question, selected);
    setResult(r);
    onSubmit(selected);
  };

  const handleAdvance = () => {
    setSelected(null);
    setResult(null);
    onAdvance();
  };

  return (
    <section className="question" aria-label="Comprehension question">
      <h2 style={{ fontSize: "1.1rem", margin: 0 }}>
        {annotateArabic(question.prompt).map((part, i) =>
          typeof part === "string" ? (
            <span key={i}>{part}</span>
          ) : (
            <span key={i} lang="ar" dir="rtl">
              {part.arabic}
            </span>
          )
        )}
      </h2>
      <div className="question__options" role="radiogroup" aria-label="Answer options">
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = result?.kind === "correct" && i === question.correctIndex;
          const isIncorrect =
            result?.kind === "incorrect" && i === selected;
          const showCorrect =
            result && i === question.correctIndex && result.kind === "incorrect";
          const cls = [
            "question__option",
            isCorrect ? "question__option--correct" : "",
            isIncorrect ? "question__option--incorrect" : "",
            showCorrect ? "question__option--correct" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={result !== null}
              className={cls}
              onClick={() => setSelected(i)}
            >
              <span aria-hidden="true">{isSelected ? "●" : "○"}</span>
              <span>
                {annotateArabic(opt).map((part, j) =>
                  typeof part === "string" ? (
                    <span key={j}>{part}</span>
                  ) : (
                    <span key={j} lang="ar" dir="rtl">
                      {part.arabic}
                    </span>
                  )
                )}
              </span>
            </button>
          );
        })}
      </div>
      {result === null ? (
        <button
          type="button"
          className="btn btn--primary"
          disabled={selected === null}
          onClick={handleSubmit}
        >
          Check answer
        </button>
      ) : (
        <>
          <p
            className="question__feedback"
            style={{
              borderLeftColor:
                result.kind === "correct"
                  ? "var(--color-success)"
                  : "var(--color-error)",
            }}
          >
            <strong>
              {result.kind === "correct" ? "Correct." : "Not quite."}
            </strong>{" "}
            {result.explanation}
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleAdvance}
          >
            {isLast ? "Finish lesson" : "Next sentence"}
          </button>
        </>
      )}
    </section>
  );
}