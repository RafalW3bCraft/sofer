/**
 * Storage migration smoke test. Uses jsdom-style polyfill of localStorage
 * via globalThis so we can exercise the V1 → V2 migration path end-to-end
 * without spinning up a browser.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function makeLocalStorageStub() {
  const data = new Map<string, string>();
  return {
    getItem(key: string): string | null {
      return data.has(key) ? (data.get(key) as string) : null;
    },
    setItem(key: string, value: string): void {
      data.set(key, String(value));
    },
    removeItem(key: string): void {
      data.delete(key);
    },
    clear(): void {
      data.clear();
    },
    key(i: number): string | null {
      return Array.from(data.keys())[i] ?? null;
    },
    get length(): number {
      return data.size;
    },
  };
}

describe("readProgress — V1 → V2 migration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it("migrates a legacy V1 record and removes the V1 key", async () => {
    const stub = makeLocalStorageStub();
    stub.setItem(
      "sofer.progress.v1",
      JSON.stringify({
        schemaVersion: 1,
        lessons: {
          "greetings-1": {
            completedAt: "2026-10-22T00:00:00.000Z",
            lastQuestionCorrect: true,
          },
        },
        totalQuestionsAnswered: 3,
        totalQuestionsCorrect: 2,
        lastActivityAt: "2026-10-22T00:00:00.000Z",
      })
    );
    (globalThis as { localStorage?: unknown }).localStorage = stub;

    const { readProgress } = await import("../../client/src/lib/storage");
    const r = readProgress();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.migrated).toBe(true);
    expect(r.value.schemaVersion).toBe(2);
    expect(r.value.totalQuestionsAnswered).toBe(3);
    expect(r.value.totalQuestionsCorrect).toBe(2);
    expect(r.value.lessons["greetings-1"]?.completedAt).toBeNull();
    // The V1 key should be gone, V2 written.
    expect(stub.getItem("sofer.progress.v1")).toBeNull();
    expect(stub.getItem("sofer.progress.v2")).not.toBeNull();
  });

  it("returns 'corrupted' on malformed JSON", async () => {
    const stub = makeLocalStorageStub();
    stub.setItem("sofer.progress.v1", "{not-json");
    (globalThis as { localStorage?: unknown }).localStorage = stub;
    const { readProgress } = await import("../../client/src/lib/storage");
    const r = readProgress();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("corrupted");
    // The bad key is cleared to avoid an infinite broken state.
    expect(stub.getItem("sofer.progress.v1")).toBeNull();
  });

  it("returns 'missing' when no progress has ever been saved", async () => {
    const stub = makeLocalStorageStub();
    (globalThis as { localStorage?: unknown }).localStorage = stub;
    const { readProgress } = await import("../../client/src/lib/storage");
    const r = readProgress();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("missing");
  });

  it("returns 'unsupported_version' for an unknown version on V2 key", async () => {
    const stub = makeLocalStorageStub();
    stub.setItem(
      "sofer.progress.v2",
      JSON.stringify({
        schemaVersion: 99,
        lessons: {},
        totalQuestionsAnswered: 0,
        totalQuestionsCorrect: 0,
        lastActivityAt: "1970-01-01T00:00:00.000Z",
      })
    );
    (globalThis as { localStorage?: unknown }).localStorage = stub;
    const { readProgress } = await import("../../client/src/lib/storage");
    const r = readProgress();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("unsupported_version");
  });
});