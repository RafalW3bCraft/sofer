/**
 * Database connection (postgres.js + Drizzle). Optional at runtime: when
 * DATABASE_URL is unset the server runs in anonymous local-first mode and
 * every /api/me route returns 503 feature_unavailable — the hackathon
 * learning loop is unaffected.
 */
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export type Db = PostgresJsDatabase<typeof schema>;

let client: postgres.Sql | null = null;
let db: Db | null = null;

export function getDb(): Db | null {
  if (db) return db;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  client = postgres(url, {
    max: 5,
    connect_timeout: 10,
    idle_timeout: 30,
    // Never log queries containing values (could carry learner data).
    onnotice: () => {},
  });
  db = drizzle(client, { schema });
  return db;
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.end({ timeout: 5 });
    client = null;
    db = null;
  }
}

/** Test helper: build a Db against an explicit URL (ephemeral Postgres). */
export function createDb(url: string): { db: Db; close: () => Promise<void> } {
  const sql = postgres(url, { max: 2, connect_timeout: 10 });
  const d = drizzle(sql, { schema });
  return { db: d, close: () => sql.end({ timeout: 5 }) };
}
