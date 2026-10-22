import { z } from "zod";
import {
  ProgressV1Schema,
  TrickyTokensV1Schema,
  type ProgressV1,
  type TrickyTokensV1,
} from "../../../shared/schemas";

const PROGRESS_KEY = "sofer.progress.v1";
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
  const raw = localStorage.getItem(key);
  if (raw === null) return { ok: false, reason: "missing" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Corrupt JSON — clear and report.
    localStorage.removeItem(key);
    return { ok: false, reason: "corrupted" };
  }
  // Cheap version check before Zod parse to give a clearer reason.
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "schemaVersion" in parsed &&
    (parsed as { schemaVersion: unknown }).schemaVersion !== supportedVersion
  ) {
    localStorage.removeItem(key);
    return { ok: false, reason: "unsupported_version" };
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    localStorage.removeItem(key);
    return { ok: false, reason: "corrupted" };
  }
  return { ok: true, value: result.data };
}

export function readProgress(): StorageReadResult<ProgressV1> {
  return safeRead<ProgressV1>(PROGRESS_KEY, ProgressV1Schema, 1);
}

export function writeProgress(progress: ProgressV1): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function clearProgress(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(PROGRESS_KEY);
}

export function readTrickyTokens(): StorageReadResult<TrickyTokensV1> {
  return safeRead<TrickyTokensV1>(TRICKY_KEY, TrickyTokensV1Schema, 1);
}

export function writeTrickyTokens(tokens: TrickyTokensV1): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(TRICKY_KEY, JSON.stringify(tokens));
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

export function emptyProgress(): ProgressV1 {
  return {
    schemaVersion: 1,
    lessons: {},
    totalQuestionsAnswered: 0,
    totalQuestionsCorrect: 0,
    lastActivityAt: new Date(0).toISOString(),
  };
}

export function emptyTrickyTokens(): TrickyTokensV1 {
  return { schemaVersion: 1, tricky: {} };
}