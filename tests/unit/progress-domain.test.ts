import { describe, expect, it } from "vitest";
import {
  emptyLessonProgress,
  emptyProgressV2,
  isLessonComplete,
  lessonsCompletedCount,
  migrateProgressV1ToV2,
  resumeSentenceIndex,
  submitAnswer,
  accuracyPercent,
} from "../../client/src/lib/progress";
import type { ProgressV1, ProgressV2 } from "../../shared/schemas";

const LESSON = "greetings-1";
const SENTENCE_IDS = ["g1-s1", "g1-s2", "g1-s3"] as const;

describe("submitAnswer — completion semantics", () => {
  it("does NOT mark a lesson complete after the first sentence is answered", () => {
    let p: ProgressV2 = emptyProgressV2();
    const r = submitAnswer(p, {
      lessonId: LESSON,
      sentenceId: SENTENCE_IDS[0],
      correct: true,
      requiredSentenceIds: [...SENTENCE_IDS],
    });
    p = r.next;
    expect(isLessonComplete(p, LESSON, [...SENTENCE_IDS])).toBe(false);
    expect(p.lessons[LESSON]?.completedAt).toBeNull();
    expect(p.totalQuestionsAnswered).toBe(1);
    expect(p.totalQuestionsCorrect).toBe(1);
    expect(r.lessonJustCompleted).toBe(false);
  });

  it("marks a 3-sentence lesson complete only after the third answer", () => {
    let p: ProgressV2 = emptyProgressV2();
    for (let i = 0; i < SENTENCE_IDS.length - 1; i += 1) {
      const r = submitAnswer(p, {
        lessonId: LESSON,
        sentenceId: SENTENCE_IDS[i]!,
        correct: true,
        requiredSentenceIds: [...SENTENCE_IDS],
      });
      p = r.next;
      expect(r.lessonJustCompleted).toBe(false);
    }
    const final = submitAnswer(p, {
      lessonId: LESSON,
      sentenceId: SENTENCE_IDS[SENTENCE_IDS.length - 1]!,
      correct: true,
      requiredSentenceIds: [...SENTENCE_IDS],
    });
    expect(final.lessonJustCompleted).toBe(true);
    expect(final.next.lessons[LESSON]?.completedAt).not.toBeNull();
    expect(isLessonComplete(final.next, LESSON, [...SENTENCE_IDS])).toBe(true);
  });

  it("does not double-count when the same sentence is answered twice", () => {
    let p: ProgressV2 = emptyProgressV2();
    const first = submitAnswer(p, {
      lessonId: LESSON,
      sentenceId: SENTENCE_IDS[0],
      correct: true,
      requiredSentenceIds: [...SENTENCE_IDS],
    });
    p = first.next;
    const second = submitAnswer(p, {
      lessonId: LESSON,
      sentenceId: SENTENCE_IDS[0],
      correct: true,
      requiredSentenceIds: [...SENTENCE_IDS],
    });
    expect(second.next.totalQuestionsAnswered).toBe(1);
    expect(second.next.totalQuestionsCorrect).toBe(1);
  });

  it("corrects totals when the same sentence is re-answered from wrong to right", () => {
    let p: ProgressV2 = emptyProgressV2();
    p = submitAnswer(p, {
      lessonId: LESSON,
      sentenceId: SENTENCE_IDS[0],
      correct: false,
      requiredSentenceIds: [...SENTENCE_IDS],
    }).next;
    expect(p.totalQuestionsAnswered).toBe(1);
    expect(p.totalQuestionsCorrect).toBe(0);
    p = submitAnswer(p, {
      lessonId: LESSON,
      sentenceId: SENTENCE_IDS[0],
      correct: true,
      requiredSentenceIds: [...SENTENCE_IDS],
    }).next;
    expect(p.totalQuestionsAnswered).toBe(1);
    expect(p.totalQuestionsCorrect).toBe(1);
  });

  it("corrects totals when the same sentence is re-answered from right to wrong", () => {
    let p: ProgressV2 = emptyProgressV2();
    p = submitAnswer(p, {
      lessonId: LESSON,
      sentenceId: SENTENCE_IDS[0],
      correct: true,
      requiredSentenceIds: [...SENTENCE_IDS],
    }).next;
    p = submitAnswer(p, {
      lessonId: LESSON,
      sentenceId: SENTENCE_IDS[0],
      correct: false,
      requiredSentenceIds: [...SENTENCE_IDS],
    }).next;
    expect(p.totalQuestionsAnswered).toBe(1);
    expect(p.totalQuestionsCorrect).toBe(0);
  });

  it("keeps different lessons isolated", () => {
    let p: ProgressV2 = emptyProgressV2();
    p = submitAnswer(p, {
      lessonId: "greetings-1",
      sentenceId: "g1-s1",
      correct: true,
      requiredSentenceIds: ["g1-s1", "g1-s2", "g1-s3"],
    }).next;
    p = submitAnswer(p, {
      lessonId: "numbers-1",
      sentenceId: "n1-s1",
      correct: false,
      requiredSentenceIds: ["n1-s1", "n1-s2"],
    }).next;
    expect(p.lessons["greetings-1"]?.answers["g1-s1"]?.correct).toBe(true);
    expect(p.lessons["numbers-1"]?.answers["n1-s1"]?.correct).toBe(false);
    expect(p.lessons["greetings-1"]?.answers["n1-s1"]).toBeUndefined();
    expect(p.totalQuestionsAnswered).toBe(2);
    expect(p.totalQuestionsCorrect).toBe(1);
  });
});

describe("resumeSentenceIndex", () => {
  it("returns 0 for a lesson that has no recorded answers", () => {
    expect(
      resumeSentenceIndex(emptyProgressV2(), LESSON, [...SENTENCE_IDS])
    ).toBe(0);
  });

  it("returns the index of the first un-answered sentence", () => {
    let p: ProgressV2 = emptyProgressV2();
    p = submitAnswer(p, {
      lessonId: LESSON,
      sentenceId: SENTENCE_IDS[0],
      correct: true,
      requiredSentenceIds: [...SENTENCE_IDS],
    }).next;
    expect(resumeSentenceIndex(p, LESSON, [...SENTENCE_IDS])).toBe(1);
  });

  it("returns sentenceIds.length when the lesson is fully answered", () => {
    let p: ProgressV2 = emptyProgressV2();
    for (const id of SENTENCE_IDS) {
      p = submitAnswer(p, {
        lessonId: LESSON,
        sentenceId: id,
        correct: true,
        requiredSentenceIds: [...SENTENCE_IDS],
      }).next;
    }
    expect(resumeSentenceIndex(p, LESSON, [...SENTENCE_IDS])).toBe(
      SENTENCE_IDS.length
    );
  });
});

describe("accuracyPercent + lessonsCompletedCount", () => {
  it("returns 0 when no questions answered", () => {
    expect(accuracyPercent(emptyProgressV2())).toBe(0);
    expect(lessonsCompletedCount(emptyProgressV2())).toBe(0);
  });

  it("rounds to the nearest integer percent", () => {
    const p: ProgressV2 = {
      ...emptyProgressV2(),
      totalQuestionsAnswered: 3,
      totalQuestionsCorrect: 2,
    };
    expect(accuracyPercent(p)).toBe(67);
  });

  it("counts only lessons whose completedAt is set", () => {
    const lesson: ProgressV2["lessons"][string] = {
      completedAt: new Date().toISOString(),
      answers: { "g1-s1": { correct: true, answeredAt: "" } },
    };
    const partial: ProgressV2["lessons"][string] = {
      completedAt: null,
      answers: { "n1-s1": { correct: true, answeredAt: "" } },
    };
    const p: ProgressV2 = {
      ...emptyProgressV2(),
      lessons: { "greetings-1": lesson, "numbers-1": partial },
    };
    expect(lessonsCompletedCount(p)).toBe(1);
  });
});

describe("V1 → V2 migration", () => {
  it("carries the legacy totals but drops the bogus completedAt flags", () => {
    const v1: ProgressV1 = {
      schemaVersion: 1,
      lessons: {
        "greetings-1": {
          completedAt: "2026-10-22T00:00:00.000Z",
          lastQuestionCorrect: true,
        },
      },
      totalQuestionsAnswered: 5,
      totalQuestionsCorrect: 4,
      lastActivityAt: "2026-10-22T00:00:00.000Z",
    };
    const v2 = migrateProgressV1ToV2(v1);
    expect(v2.schemaVersion).toBe(2);
    expect(v2.totalQuestionsAnswered).toBe(5);
    expect(v2.totalQuestionsCorrect).toBe(4);
    expect(v2.lessons["greetings-1"]?.completedAt).toBeNull();
    expect(Object.keys(v2.lessons["greetings-1"]?.answers ?? {})).toHaveLength(0);
    expect(lessonsCompletedCount(v2)).toBe(0);
  });

  it("returns an empty V2 for an unknown input shape", () => {
    const v2 = migrateProgressV1ToV2(null);
    expect(v2).toEqual(emptyProgressV2());
  });
});

describe("empty helpers", () => {
  it("emptyLessonProgress produces a fresh, empty shape", () => {
    const e = emptyLessonProgress();
    expect(e.completedAt).toBeNull();
    expect(e.answers).toEqual({});
  });
});