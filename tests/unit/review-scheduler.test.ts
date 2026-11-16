import { describe, expect, it } from "vitest";
import { getDueReviewRecords, scheduleReviewAttempt } from "../../client/src/lib/reviewScheduler";

describe("review scheduler", () => {
  it("schedules a missed word for a short retry and resets repetitions", () => {
    const now = new Date("2026-11-16T12:00:00.000Z");
    const record = scheduleReviewAttempt("lesson:s1:0", undefined, false, now);
    expect(record.repetitions).toBe(0);
    expect(record.difficulty).toBe("learning");
    expect(record.dueAt).toBe("2026-11-16T12:10:00.000Z");
  });

  it("uses bounded intervals after correct recalls", () => {
    const now = new Date("2026-11-16T12:00:00.000Z");
    const first = scheduleReviewAttempt("lesson:s1:0", undefined, true, now);
    const second = scheduleReviewAttempt("lesson:s1:0", first, true, now);
    expect(first.dueAt).toBe("2026-11-17T12:00:00.000Z");
    expect(second.dueAt).toBe("2026-11-19T12:00:00.000Z");
    expect(second.difficulty).toBe("steady");
  });

  it("returns only due records in deterministic order", () => {
    const now = new Date("2026-11-16T12:00:00.000Z");
    const store = {
      schemaVersion: 1 as const,
      records: {
        later: scheduleReviewAttempt("later", undefined, true, now),
        earlier: { ...scheduleReviewAttempt("earlier", undefined, false, now), dueAt: "2026-11-16T11:00:00.000Z" },
      },
    };
    expect(getDueReviewRecords(store, now).map((record) => record.tokenId)).toEqual(["earlier"]);
  });
});
