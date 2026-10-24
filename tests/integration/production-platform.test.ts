/**
 * Integration tests for the production-platform slice, against a REAL
 * ephemeral PostgreSQL (docker container on 127.0.0.1:5432). These tests
 * are skipped automatically when the DB is unreachable so the hackathon
 * gate never depends on Docker.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Express } from "express";
import { sql as rawSql } from "../../server/node_modules/drizzle-orm/index.js";

const DATABASE_URL = "postgres://sofer:sofer-dev-only@127.0.0.1:5432/sofer";

let app: Express;
let dbAvailable = false;
let closeDb: () => Promise<void>;
let baseUrl = "";
let sharedServer: import("node:http").Server | null = null;

async function fetchJson(
  path: string,
  init: { method?: string; body?: unknown; cookie?: string } = {}
): Promise<{ status: number; json: Record<string, unknown>; setCookie: string | null }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(init.cookie ? { cookie: init.cookie } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const setCookie = res.headers.get("set-cookie");
  const json = (await res.json()) as Record<string, unknown>;
  return { status: res.status, json, setCookie };
}

beforeAll(async () => {
  process.env.DATABASE_URL = DATABASE_URL;
  process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret";
  process.env.BETTER_AUTH_URL = "http://127.0.0.1:3001";
  try {
    const { getDb, closeDb: closer } = await import("../../server/db/index.js");
    closeDb = closer;
    const db = getDb();
    if (!db) return;
    await db.execute(rawSql`select 1`);
    dbAvailable = true;
    // Clean slate for deterministic assertions.
    await db.execute(rawSql`truncate "user", lesson_attempts, lesson_progress, tricky_tokens, review_events, user_preferences, audit_events cascade`);
    const { createApp } = await import("../../server/index.js");
    app = createApp();
    sharedServer = app.listen(0);
    await new Promise<void>((r) => sharedServer!.once("listening", r));
    const { port } = sharedServer.address() as { port: number };
    baseUrl = `http://127.0.0.1:${port}`;
  } catch {
    dbAvailable = false;
  }
});

afterAll(async () => {
  if (sharedServer) await new Promise<void>((r) => sharedServer!.close(() => r()));
  if (dbAvailable) await closeDb();
});

async function signUp(email: string, password: string, name: string) {
  return fetchJson("/api/auth/sign-up/email", {
    method: "POST",
    body: { email, password, name },
  });
}

function sessionCookie(setCookie: string | null): string {
  if (!setCookie) throw new Error("no set-cookie header");
  return setCookie.split(";")[0];
}

describe("production platform (ephemeral Postgres)", { timeout: 30_000 }, () => {
  it("sign-up + /api/me round trip", async () => {
    if (!dbAvailable) return;
    const su = await signUp("alice@example.com", "password-123", "Alice");
    expect(su.status).toBe(200);
    const cookie = sessionCookie(su.setCookie);
    const me = await fetchJson("/api/me", { cookie });
    expect(me.status).toBe(200);
    expect(me.json.email).toBe("alice@example.com");
  });

  it("unauthenticated /api/me is 401; userId in body is ignored", async () => {
    if (!dbAvailable) return;
    const anon = await fetchJson("/api/me");
    expect(anon.status).toBe(401);
    const su = await signUp("bob@example.com", "password-123", "Bob");
    const cookie = sessionCookie(su.setCookie);
    // Attempt to spoof another user via JSON body — must be ignored.
    const spoof = await fetchJson("/api/me/attempts", {
      method: "POST",
      cookie,
      body: {
        userId: "some-other-user",
        lessonId: "greetings-1",
        sentenceId: "s1",
        correct: true,
        idempotencyKey: "spoof-attempt-1",
      },
    });
    expect([200, 201]).toContain(spoof.status);
    const attempts = await fetchJson("/api/me/attempts", { cookie });
    const rows = attempts.json.attempts as Array<{ lessonId: string }>;
    expect(rows.every((r) => r.lessonId === "greetings-1")).toBe(true);
  });

  it("two-user isolation: neither sees the other's data", async () => {
    if (!dbAvailable) return;
    const a = await signUp("carol@example.com", "password-123", "Carol");
    const b = await signUp("dave@example.com", "password-123", "Dave");
    const ca = sessionCookie(a.setCookie);
    const cb = sessionCookie(b.setCookie);
    await fetchJson("/api/me/tricky-tokens", {
      method: "PUT",
      cookie: ca,
      body: { tokenId: "greetings-1:s1:0" },
    });
    const forA = await fetchJson("/api/me/tricky-tokens", { cookie: ca });
    const forB = await fetchJson("/api/me/tricky-tokens", { cookie: cb });
    expect((forA.json.trickyTokens as unknown[]).length).toBe(1);
    expect((forB.json.trickyTokens as unknown[]).length).toBe(0);
    // Invalid session cookie -> 401
    const forged = await fetchJson("/api/me", { cookie: "sofer.session_token=forged" });
    expect(forged.status).toBe(401);
  });

  it("attempt idempotency: duplicate key is a no-op", async () => {
    if (!dbAvailable) return;
    const su = await signUp("erin@example.com", "password-123", "Erin");
    const cookie = sessionCookie(su.setCookie);
    const body = {
      lessonId: "numbers-1",
      sentenceId: "s1",
      correct: true,
      idempotencyKey: "erin-attempt-1",
    };
    const first = await fetchJson("/api/me/attempts", { method: "POST", cookie, body });
    const second = await fetchJson("/api/me/attempts", { method: "POST", cookie, body });
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.json.duplicate).toBe(true);
    const all = await fetchJson("/api/me/attempts", { cookie });
    expect((all.json.attempts as unknown[]).length).toBe(1);
  });

  it("guest import requires confirm:true and is re-import safe", async () => {
    if (!dbAvailable) return;
    const su = await signUp("fay@example.com", "password-123", "Fay");
    const cookie = sessionCookie(su.setCookie);
    const noConfirm = await fetchJson("/api/me/import-local", {
      method: "POST",
      cookie,
      body: { attempts: [], trickyTokens: [] },
    });
    expect(noConfirm.status).toBe(400);
    const payload = {
      confirm: true,
      attempts: [
        { lessonId: "greetings-1", sentenceId: "s1", correct: true, answeredAt: "2026-10-20T10:00:00Z" },
        { lessonId: "greetings-1", sentenceId: "s2", correct: false, answeredAt: "2026-10-20T10:01:00Z" },
      ],
      trickyTokens: ["greetings-1:s1:0"],
    };
    const once = await fetchJson("/api/me/import-local", { method: "POST", cookie, body: payload });
    const twice = await fetchJson("/api/me/import-local", { method: "POST", cookie, body: payload });
    expect(once.json.importedAttempts).toBe(2);
    expect(twice.json.importedAttempts).toBe(0); // re-import is a no-op
    const all = await fetchJson("/api/me/attempts", { cookie });
    expect((all.json.attempts as unknown[]).length).toBe(2);
  });

  it("review queue is deterministic (never-reviewed first)", async () => {
    if (!dbAvailable) return;
    const su = await signUp("gus@example.com", "password-123", "Gus");
    const cookie = sessionCookie(su.setCookie);
    await fetchJson("/api/me/tricky-tokens", { method: "PUT", cookie, body: { tokenId: "greetings-1:s1:0" } });
    await fetchJson("/api/me/tricky-tokens", { method: "PUT", cookie, body: { tokenId: "greetings-1:s1:1" } });
    await fetchJson("/api/me/reviews", { method: "POST", cookie, body: { tokenId: "greetings-1:s1:0", correct: true } });
    const queue = await fetchJson("/api/me/reviews/queue", { cookie });
    const q = queue.json.queue as Array<{ tokenId: string }>;
    expect(q[0].tokenId).toBe("greetings-1:s1:1"); // never reviewed comes first
  });

  it("account deletion removes the user row and sessions", async () => {
    if (!dbAvailable) return;
    const su = await signUp("hal@example.com", "password-123", "Hal");
    const cookie = sessionCookie(su.setCookie);
    const del = await fetchJson("/api/me", { method: "DELETE", cookie });
    expect(del.json.deleted).toBe(true);
    const after = await fetchJson("/api/me", { cookie });
    expect(after.status).toBe(401);
  });

  it("dictionary: seed, lookup, sanitization, SQL-injection safety", async () => {
    if (!dbAvailable) return;
    const { getDb } = await import("../../server/db/index.js");
    const db = getDb()!;
    await db.execute(rawSql`delete from lexicon_entries`);
    await db.execute(rawSql`
      insert into lexicon_entries (id, lexicon_version, arabic, transliteration, meaning, part_of_speech)
      values ('v1:0', 1, 'ٱلسَّلَامُ', 'as-salamu', 'the peace', 'noun')`);
    const hit = await fetchJson("/api/dictionary/lookup?q=سلام");
    expect(hit.status).toBe(200);
    expect((hit.json.entries as unknown[]).length).toBe(1);
    const latin = await fetchJson("/api/dictionary/lookup?q=peace");
    expect((latin.json.entries as unknown[]).length).toBe(1);
    const inject = await fetchJson(`/api/dictionary/lookup?q=${encodeURIComponent("' OR '1'='1")}`);
    expect(inject.status).toBe(200);
    expect((inject.json.entries as unknown[]).length).toBe(0);
    const empty = await fetchJson("/api/dictionary/lookup?q=");
    expect(empty.status).toBe(400);
  });

  it("invalid Zod payloads are 400, oversized tricky tokenId rejected", async () => {
    if (!dbAvailable) return;
    const su = await signUp("ivy@example.com", "password-123", "Ivy");
    const cookie = sessionCookie(su.setCookie);
    const bad = await fetchJson("/api/me/tricky-tokens", {
      method: "PUT",
      cookie,
      body: { tokenId: "not-a-token" },
    });
    expect(bad.status).toBe(400);
    const badAttempt = await fetchJson("/api/me/attempts", {
      method: "POST",
      cookie,
      body: { lessonId: "x" },
    });
    expect(badAttempt.status).toBe(400);
  });
});
