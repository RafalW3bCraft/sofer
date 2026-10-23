import { z } from "zod";
import {
  ProgressV2Schema,
  TrickyTokensV1Schema,
  type ProgressV2,
  type TrickyTokensV1,
} from "../../../shared/schemas";
import { migrateProgressV1ToV2, emptyProgressV2 } from "./progress";

const PROGRESS_KEY = "sofer.progress.v1"; // legacy key preserved for migration
const PROGRESS_KEY_V2 = "sofer.progress.v2";
const TRICKY_KEY = "sofer.tokens.v1";

export type StorageReadResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "missing" | "corrupted" | "unsupported_version" };

function safeRead<T>(
  key: string,
  schema: z.ZodType<T>,
  supportedVersion: number
): StorageReadResult<T> {
  if (typeof localStorage === "undefined") return { ok: false, reason: "missing" };
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return { ok: false, reason: "corrupted" };
  }
  if (raw === null) return { ok: false, reason: "missing" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Corrupt JSON — remove and report.
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore secondary failure
    }
    return { ok: false, reason: "corrupted" };
  }
  // Cheap version check before Zod parse to give a clearer reason.
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "schemaVersion" in parsed &&
    (parsed as { schemaVersion: unknown }).schemaVersion !== supportedVersion
  ) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore secondary failure
    }
    return { ok: false, reason: "unsupported_version" };
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore secondary failure
    }
    return { ok: false, reason: "corrupted" };
  }
  return { ok: true, value: result.data };
}

function safeWrite(key: string, value: unknown): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export type ProgressReadResult =
  | { ok: true; value: ProgressV2; migrated: boolean }
  | { ok: false; reason: "missing" | "corrupted" | "unsupported_version" };

/**
 * Reads progress with automatic V1 → V2 migration. The V1 key is preserved
 * for one read so the migration can run, then deleted. The V2 key is the
 * canonical store from that point on.
 */
export function readProgress(): ProgressReadResult {
  // Try the canonical V2 store first.
  const v2 = safeRead<ProgressV2>(PROGRESS_KEY_V2, ProgressV2Schema, 2);
  if (v2.ok) return { ok: true, value: v2.value, migrated: false };

  // Fall back to the legacy V1 store. Do NOT delete V1 until we have
  // successfully written V2 — that way a write failure on a flaky device
  // doesn't strand the learner.
  if (typeof localStorage !== "undefined") {
    let raw: string | null;
    try {
      raw = localStorage.getItem(PROGRESS_KEY);
    } catch {
      raw = null;
    }
    if (raw !== null) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        safeRemove(PROGRESS_KEY);
        return { ok: false, reason: "corrupted" };
      }
      const migrated = migrateProgressV1ToV2(parsed);
      // Attempt to persist the migrated V2. If write fails we still return
      // the in-memory V2 so the session can continue.
      const wrote = safeWrite(PROGRESS_KEY_V2, migrated);
      if (wrote) safeRemove(PROGRESS_KEY);
      return { ok: true, value: migrated, migrated: true };
    }
  }

  return { ok: false, reason: v2.reason };
}

export function writeProgress(progress: ProgressV2): boolean {
  return safeWrite(PROGRESS_KEY_V2, progress);
}

export function clearProgress(): void {
  safeRemove(PROGRESS_KEY);
  safeRemove(PROGRESS_KEY_V2);
}

export function readTrickyTokens(): StorageReadResult<TrickyTokensV1> {
  return safeRead<TrickyTokensV1>(TRICKY_KEY, TrickyTokensV1Schema, 1);
}

export function writeTrickyTokens(tokens: TrickyTokensV1): boolean {
  return safeWrite(TRICKY_KEY, tokens);
}

export function markTokenTricky(
  current: TrickyTokensV1,
  tokenId: string
): TrickyTokensV1 {
  if (current.tricky[tokenId]) return current;
  return {
    schemaVersion: 1,
    tricky: {
      ...current.tricky,
      [tokenId]: { markedAt: new Date().toISOString() },
    },
  };
}

export function unmarkTokenTricky(
  current: TrickyTokensV1,
  tokenId: string
): TrickyTokensV1 {
  if (!current.tricky[tokenId]) return current;
  const next = { ...current.tricky };
  delete next[tokenId];
  return { schemaVersion: 1, tricky: next };
}

/**
 * Re-export the V2 empty for callers that want a guaranteed-fresh default.
 */
export function emptyProgress(): ProgressV2 {
  return emptyProgressV2();
}

export function emptyTrickyTokens(): TrickyTokensV1 {
  return { schemaVersion: 1, tricky: {} };
}