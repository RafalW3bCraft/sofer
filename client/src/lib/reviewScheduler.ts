import type { ReviewRecord, ReviewStore } from "../../../shared/schemas";

const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;
const RETRY_MINUTES = 10;

export function scheduleReviewAttempt(
  tokenId: string,
  previous: ReviewRecord | undefined,
  correct: boolean,
  now = new Date(),
): ReviewRecord {
  const repetitions = correct ? (previous?.repetitions ?? 0) + 1 : 0;
  const intervalMs = correct
    ? (REVIEW_INTERVAL_DAYS[Math.min(repetitions - 1, REVIEW_INTERVAL_DAYS.length - 1)] ?? 30) * 86_400_000
    : RETRY_MINUTES * 60_000;
  const lastAttemptAt = now.toISOString();
  return {
    tokenId,
    lastAttemptAt,
    correct,
    dueAt: new Date(now.getTime() + intervalMs).toISOString(),
    repetitions,
    difficulty: correct && repetitions >= 2 ? "steady" : "learning",
  };
}

export function getDueReviewRecords(store: ReviewStore, now = new Date()): ReviewRecord[] {
  return Object.values(store.records)
    .filter((record) => Date.parse(record.dueAt) <= now.getTime())
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt) || a.tokenId.localeCompare(b.tokenId));
}
