/**
 * Pure domain functions for learner progress.
 *
 * All state transitions are deterministic and idempotent:
 * - `submitAnswer` records an answer for a (lessonId, sentenceId) pair.
 *   Repeated calls for the same pair do NOT inflate the totals — they only
 *   update the recorded answer if it changed.
 * - A lesson is "completed" iff every required sentence has a recorded answer.
 * - `isLessonComplete`, `currentAccuracy`, and `resumeSentenceIndex` are
 *   derived functions, not stored state — so reload and navigation never
 *   drift.
 *
 * These functions never touch localStorage. Persistence lives in storage.ts.
 */
import type { ProgressV2, LessonProgressV2, AnswerRecord } from "../../../shared/schemas";

export function emptyLessonProgress(): LessonProgressV2 {
  return { completedAt: null, answers: {} };
}

export function emptyProgressV2(): ProgressV2 {
  return {
    schemaVersion: 2,
    lessons: {},
    totalQuestionsAnswered: 0,
    totalQuestionsCorrect: 0,
    lastActivityAt: new Date(0).toISOString(),
  };
}

/**
 * Migrate a V1 progress record into V2.
 *
 * V1 only stored "completedAt" — which the legacy code wrote on the first
 * submitted answer, not on actual completion. We must NOT carry that
 * completion forward, because it would misrepresent V1 users as done.
 * What we DO carry forward: the count of answered questions, and (if known)
 * the correctness of the most recent attempt per lesson.
 *
 * Lesson IDs are not always known at migration time, so we re-key by the
 * legacy lesson IDs we saw. Per-sentence answers are lost in migration by
 * design — V1 never tracked them.
 */
export function migrateProgressV1ToV2(v1: unknown): ProgressV2 {
  const out = emptyProgressV2();
  if (
    typeof v1 !== "object" ||
    v1 === null ||
    !("lessons" in v1) ||
    typeof (v1 as { lessons: unknown }).lessons !== "object"
  ) {
    return out;
  }
  const lessons = (v1 as { lessons: Record<string, unknown> }).lessons;
  for (const [lessonId, lesson] of Object.entries(lessons)) {
    if (typeof lesson !== "object" || lesson === null) continue;
    const completedAt =
      "completedAt" in lesson &&
      typeof (lesson as { completedAt?: unknown }).completedAt === "string"
        ? (lesson as { completedAt: string }).completedAt
        : null;
    // V1 didn't store per-sentence answers. We clear the completion flag
    // because V1 marked completion on the first answer, not on real
    // completion. We DO preserve the legacy totals for accuracy.
    out.lessons[lessonId] = {
      completedAt: null,
      answers: {},
    };
    // completedAt is dropped intentionally — see comment above.
    void completedAt;
  }
  if (
    "totalQuestionsAnswered" in v1 &&
    typeof (v1 as { totalQuestionsAnswered?: unknown }).totalQuestionsAnswered ===
      "number"
  ) {
    out.totalQuestionsAnswered = Number(
      (v1 as { totalQuestionsAnswered: number }).totalQuestionsAnswered
    );
  }
  if (
    "totalQuestionsCorrect" in v1 &&
    typeof (v1 as { totalQuestionsCorrect?: unknown }).totalQuestionsCorrect ===
      "number"
  ) {
    out.totalQuestionsCorrect = Number(
      (v1 as { totalQuestionsCorrect: number }).totalQuestionsCorrect
    );
  }
  if (
    "lastActivityAt" in v1 &&
    typeof (v1 as { lastActivityAt?: unknown }).lastActivityAt === "string"
  ) {
    out.lastActivityAt = (v1 as { lastActivityAt: string }).lastActivityAt;
  }
  return out;
}

export interface SubmitAnswerInput {
  lessonId: string;
  sentenceId: string;
  correct: boolean;
  /** IDs of every sentence that must be answered to count the lesson as done. */
  requiredSentenceIds: string[];
}

export interface SubmitAnswerResult {
  next: ProgressV2;
  /** True iff this call actually changed stored state. */
  changed: boolean;
  /** True iff, after this call, the lesson is fully complete. */
  lessonJustCompleted: boolean;
}

/**
 * Record an answer. If the same (lessonId, sentenceId) pair was already
 * recorded, the stored answer is REPLACED and totals are corrected
 * accordingly (decrement-old + increment-new) so a re-submit cannot
 * inflate accuracy.
 */
export function submitAnswer(
  progress: ProgressV2,
  input: SubmitAnswerInput
): SubmitAnswerResult {
  const { lessonId, sentenceId, correct, requiredSentenceIds } = input;
  const lesson: LessonProgressV2 = progress.lessons[lessonId] ?? {
    completedAt: null,
    answers: {},
  };
  const previous = lesson.answers[sentenceId] as AnswerRecord | undefined;

  let totalAnswered = progress.totalQuestionsAnswered;
  let totalCorrect = progress.totalQuestionsCorrect;

  if (previous) {
    // Undo the previous contribution to the cumulative totals.
    totalAnswered -= 1;
    if (previous.correct) totalCorrect -= 1;
  }
  totalAnswered += 1;
  if (correct) totalCorrect += 1;

  const answers = { ...lesson.answers, [sentenceId]: { correct, answeredAt: new Date().toISOString() } };
  const wasCompleted = isLessonCompleteFromAnswers(
    lesson.answers,
    requiredSentenceIds
  );
  const isNowComplete = isLessonCompleteFromAnswers(
    answers,
    requiredSentenceIds
  );
  const lessonJustCompleted = !wasCompleted && isNowComplete;

  const nextLesson: LessonProgressV2 = {
    ...lesson,
    answers,
    completedAt: isNowComplete ? new Date().toISOString() : lesson.completedAt,
  };
  // If the lesson was complete and is no longer (e.g. lesson content
  // changed and a previously-answered sentence was removed), clear the
  // completed flag so the UI doesn't lie.
  if (wasCompleted && !isNowComplete) {
    nextLesson.completedAt = null;
  }

  return {
    next: {
      ...progress,
      lessons: { ...progress.lessons, [lessonId]: nextLesson },
      totalQuestionsAnswered: totalAnswered,
      totalQuestionsCorrect: totalCorrect,
      lastActivityAt: new Date().toISOString(),
    },
    changed: true,
    lessonJustCompleted,
  };
}

function isLessonCompleteFromAnswers(
  answers: Record<string, AnswerRecord>,
  requiredSentenceIds: string[]
): boolean {
  if (requiredSentenceIds.length === 0) return false;
  for (const id of requiredSentenceIds) {
    if (!answers[id]) return false;
  }
  return true;
}

export function isLessonComplete(
  progress: ProgressV2,
  lessonId: string,
  requiredSentenceIds: string[]
): boolean {
  const lesson = progress.lessons[lessonId];
  if (!lesson) return false;
  return isLessonCompleteFromAnswers(lesson.answers, requiredSentenceIds);
}

/**
 * Index of the first sentence in the lesson that has NOT been answered.
 * Used to resume a lesson from the right place on reload.
 * Returns `lesson.sentences.length` if every sentence has been answered.
 */
export function resumeSentenceIndex(
  progress: ProgressV2,
  lessonId: string,
  sentenceIds: string[]
): number {
  const lesson = progress.lessons[lessonId];
  if (!lesson) return 0;
  for (let i = 0; i < sentenceIds.length; i += 1) {
    const id = sentenceIds[i];
    if (!id) continue;
    if (!lesson.answers[id]) return i;
  }
  return sentenceIds.length;
}

export function accuracyPercent(progress: ProgressV2): number {
  if (progress.totalQuestionsAnswered === 0) return 0;
  return Math.round(
    (progress.totalQuestionsCorrect / progress.totalQuestionsAnswered) * 100
  );
}

export function lessonsCompletedCount(progress: ProgressV2): number {
  // Count only lessons with completedAt set (truthy, non-null).
  let n = 0;
  for (const lesson of Object.values(progress.lessons)) {
    if (lesson.completedAt) n += 1;
  }
  return n;
}