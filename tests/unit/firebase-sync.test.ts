import { describe, expect, it } from "vitest";
import type { LearnerSyncState } from "../../shared/schemas";
import { mergeLearnerSyncState } from "../../client/src/lib/firebase/syncDomain";
import { emptyProgressV2 } from "../../client/src/lib/progress";

function state(): LearnerSyncState {
  return {
    schemaVersion: 1,
    progress: emptyProgressV2(),
    trickyTokens: { schemaVersion: 1, tricky: {} },
    updatedAt: "2026-11-16T00:00:00.000Z",
  };
}

describe("Firebase local-first sync merge", () => {
  it("unions answer records, chooses the newer record, and recalculates totals", () => {
    const local = state();
    local.progress.lessons.greetings = {
      completedAt: null,
      answers: {
        "g1-s1": { correct: true, answeredAt: "2026-11-15T10:00:00.000Z" },
        "g1-s2": { correct: false, answeredAt: "2026-11-15T10:02:00.000Z" },
      },
    };
    const remote = state();
    remote.progress.lessons.greetings = {
      completedAt: null,
      answers: {
        "g1-s1": { correct: false, answeredAt: "2026-11-15T10:01:00.000Z" },
        "g1-s3": { correct: true, answeredAt: "2026-11-15T10:03:00.000Z" },
      },
    };

    const merged = mergeLearnerSyncState(local, remote, "2026-11-16T01:00:00.000Z");
    expect(Object.keys(merged.progress.lessons.greetings!.answers)).toHaveLength(3);
    expect(merged.progress.lessons.greetings!.answers["g1-s1"]?.correct).toBe(false);
    expect(merged.progress.totalQuestionsAnswered).toBe(3);
    expect(merged.progress.totalQuestionsCorrect).toBe(1);
  });

  it("preserves the union of tricky tokens and latest update time", () => {
    const local = state();
    const remote = state();
    local.trickyTokens.tricky.a = { markedAt: "2026-11-15T10:00:00.000Z" };
    remote.trickyTokens.tricky.a = { markedAt: "2026-11-15T10:05:00.000Z" };
    remote.trickyTokens.tricky.b = { markedAt: "2026-11-15T10:04:00.000Z" };
    const merged = mergeLearnerSyncState(local, remote, "2026-11-16T01:00:00.000Z");
    expect(merged.trickyTokens.tricky.a?.markedAt).toBe("2026-11-15T10:05:00.000Z");
    expect(merged.trickyTokens.tricky.b).toBeDefined();
    expect(merged.updatedAt).toBe("2026-11-16T01:00:00.000Z");
  });

  it("keeps a newer unmark tombstone over an older device mark", () => {
    const local = state();
    const remote = state();
    local.trickyTokens.tricky.a = {
      markedAt: "2026-11-15T10:00:00.000Z",
      removedAt: "2026-11-15T11:00:00.000Z",
    };
    remote.trickyTokens.tricky.a = { markedAt: "2026-11-15T10:30:00.000Z" };
    const merged = mergeLearnerSyncState(local, remote, "2026-11-16T01:00:00.000Z");
    expect(merged.trickyTokens.tricky.a?.removedAt).toBe("2026-11-15T11:00:00.000Z");
  });
});
