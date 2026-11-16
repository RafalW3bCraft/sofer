/**
 * Optional PostgreSQL integration checks. These run only when the caller
 * explicitly supplies SOFER_TEST_DATABASE_URL; ordinary development or CI
 * databases are never truncated or reset by this suite.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Express } from "express";
import { sql as rawSql } from "../../server/node_modules/drizzle-orm/index.js";

const DATABASE_URL = process.env.SOFER_TEST_DATABASE_URL;
let app: Express;
let dbAvailable = false;
let closeDb: () => Promise<void>;
let baseUrl = "";
let sharedServer: import("node:http").Server | null = null;

async function fetchJson(path: string, init: { method?: string; body?: unknown } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: init.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  return { status: res.status, json: await res.json() as Record<string, unknown> };
}

beforeAll(async () => {
  if (!DATABASE_URL) return;
  process.env.DATABASE_URL = DATABASE_URL;
  try {
    const { getDb, closeDb: closer } = await import("../../server/db/index.js");
    closeDb = closer;
    const db = getDb();
    if (!db) return;
    await db.execute(rawSql`select 1`);
    dbAvailable = true;
    const { createApp } = await import("../../server/index.js");
    app = createApp();
    sharedServer = app.listen(0);
    await new Promise<void>((resolve) => sharedServer!.once("listening", resolve));
    const { port } = sharedServer.address() as { port: number };
    baseUrl = `http://127.0.0.1:${port}`;
  } catch {
    dbAvailable = false;
  }
});

afterAll(async () => {
  if (sharedServer) await new Promise<void>((resolve) => sharedServer!.close(() => resolve()));
  if (dbAvailable) await closeDb();
});

describe.skipIf(!DATABASE_URL)("Firebase account boundary and PostgreSQL dictionary", { timeout: 30_000 }, () => {
  it("does not expose the retired Better Auth, /api/me, or Token Factory routes", async () => {
    if (!dbAvailable) throw new Error("SOFER_TEST_DATABASE_URL was supplied but PostgreSQL is unavailable.");
    expect((await fetchJson("/api/auth/sign-up/email", { method: "POST", body: {} })).status).toBe(404);
    expect((await fetchJson("/api/me")).status).toBe(404);
    expect((await fetchJson("/api/ai/explain", { method: "POST", body: {} })).status).toBe(404);
  });

  it("keeps dictionary lookup public, normalized, parameterized, and validates queries", async () => {
    if (!dbAvailable) throw new Error("SOFER_TEST_DATABASE_URL was supplied but PostgreSQL is unavailable.");
    const { getDb } = await import("../../server/db/index.js");
    const db = getDb()!;
    const id = `integration-${crypto.randomUUID()}`;
    try {
      await db.execute(rawSql`
        insert into lexicon_entries (id, lexicon_version, arabic, transliteration, meaning, part_of_speech)
        values (${id}, 1, 'ٱلسَّلَامُ', 'as-salamu', 'integration-only greeting', 'noun')`);
      const arabic = await fetchJson("/api/dictionary/lookup?q=سلام");
      expect(arabic.status).toBe(200);
      expect((arabic.json.entries as Array<{ meaning: string }>).some((entry) => entry.meaning === "integration-only greeting")).toBe(true);
      const latin = await fetchJson("/api/dictionary/lookup?q=integration-only");
      expect((latin.json.entries as unknown[]).length).toBeGreaterThan(0);
      const injection = await fetchJson(`/api/dictionary/lookup?q=${encodeURIComponent("' OR '1'='1")}`);
      expect((injection.json.entries as unknown[])).toHaveLength(0);
      expect((await fetchJson("/api/dictionary/lookup?q=")).status).toBe(400);
    } finally {
      await db.execute(rawSql`delete from lexicon_entries where id = ${id}`);
    }
  });
});
