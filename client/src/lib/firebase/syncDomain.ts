import {
  LearnerSyncStateSchema,
  type AnswerRecord,
  type LearnerSyncState,
  type ProgressV2,
  type TrickyTokensV1,
} from "../../../../shared/schemas";

function newest<T extends { answeredAt?: string; markedAt?: string; removedAt?: string }>(a: T, b: T): T {
  const aTime = a.answeredAt ?? a.removedAt ?? a.markedAt ?? "";
  const bTime = b.answeredAt ?? b.removedAt ?? b.markedAt ?? "";
  if (aTime !== bTime) return aTime > bTime ? a : b;
  // A deterministic tie-break prevents replicas with same-time attempts from
  // oscillating. It is not used to claim the later event was more correct.
  return JSON.stringify(a) >= JSON.stringify(b) ? a : b;
}

function mergeProgress(a: ProgressV2, b: ProgressV2): ProgressV2 {
  const lessons: ProgressV2["lessons"] = {};
  for (const lessonId of new Set([...Object.keys(a.lessons), ...Object.keys(b.lessons)])) {
    const aLesson = a.lessons[lessonId];
    const bLesson = b.lessons[lessonId];
    const answers: Record<string, AnswerRecord> = {};
    for (const sentenceId of new Set([
      ...Object.keys(aLesson?.answers ?? {}),
      ...Object.keys(bLesson?.answers ?? {}),
    ])) {
      const left = aLesson?.answers[sentenceId];
      const right = bLesson?.answers[sentenceId];
      if (left && right) answers[sentenceId] = newest(left, right);
      else if (left) answers[sentenceId] = left;
      else if (right) answers[sentenceId] = right;
    }
    const completedDates = [aLesson?.completedAt, bLesson?.completedAt].filter(
      (value): value is string => Boolean(value),
    );
    lessons[lessonId] = {
      completedAt: completedDates.sort().at(-1) ?? null,
      answers,
    };
  }

  let totalQuestionsAnswered = 0;
  let totalQuestionsCorrect = 0;
  for (const lesson of Object.values(lessons)) {
    for (const answer of Object.values(lesson.answers)) {
      totalQuestionsAnswered += 1;
      if (answer.correct) totalQuestionsCorrect += 1;
    }
  }

  return {
    schemaVersion: 2,
    lessons,
    totalQuestionsAnswered,
    totalQuestionsCorrect,
    lastActivityAt: [a.lastActivityAt, b.lastActivityAt].sort().at(-1) ?? new Date(0).toISOString(),
  };
}

function mergeTricky(a: TrickyTokensV1, b: TrickyTokensV1): TrickyTokensV1 {
  const tricky: TrickyTokensV1["tricky"] = {};
  for (const id of new Set([...Object.keys(a.tricky), ...Object.keys(b.tricky)])) {
    const left = a.tricky[id];
    const right = b.tricky[id];
    tricky[id] = left && right ? newest(left, right) : left ?? right!;
  }
  return { schemaVersion: 1, tricky };
}

export function mergeLearnerSyncState(
  local: LearnerSyncState,
  remote: LearnerSyncState | null,
  updatedAt: string,
): LearnerSyncState {
  const candidate: LearnerSyncState = remote
    ? {
        schemaVersion: 1,
        progress: mergeProgress(local.progress, remote.progress),
        trickyTokens: mergeTricky(local.trickyTokens, remote.trickyTokens),
        updatedAt: [local.updatedAt, remote.updatedAt, updatedAt].sort().at(-1)!,
      }
    : { ...local, updatedAt };
  return LearnerSyncStateSchema.parse(candidate);
}
