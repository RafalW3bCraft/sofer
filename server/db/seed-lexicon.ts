/**
 * Seed the starter lexicon (version 1) from the curated lesson tokens.
 * This is deliberately small and sourced from reviewed content — it is NOT
 * a full dictionary (documented limitation; see parity-roadmap.md).
 *
 * Run: tsx db/seed-lexicon.ts   (requires DATABASE_URL)
 */
import { getDb, closeDb } from "./index.js";
import { lexiconEntries } from "./schema.js";
import lessonsData from "../../client/src/content/lessons.json" with { type: "json" };
import { sql } from "drizzle-orm";

const LEXICON_VERSION = 1;

async function main() {
  const db = getDb();
  if (!db) {
    console.error("DATABASE_URL not set; cannot seed.");
    process.exit(1);
  }
  const seen = new Map<string, { transliteration: string; meaning: string; partOfSpeech: string }>();
  for (const lesson of lessonsData.lessons) {
    for (const sentence of lesson.sentences) {
      for (const token of sentence.tokens) {
        if (token.partOfSpeech === "punct") continue;
        if (!seen.has(token.arabic)) {
          seen.set(token.arabic, {
            transliteration: token.transliteration,
            meaning: token.meaning,
            partOfSpeech: token.partOfSpeech,
          });
        }
      }
    }
  }
  // Idempotent reseed: replace this version's rows in one transaction.
  await db.delete(lexiconEntries).where(sql`${lexiconEntries.lexiconVersion} = ${LEXICON_VERSION}`);
  let n = 0;
  for (const [arabic, info] of seen) {
    await db.insert(lexiconEntries).values({
      id: `v${LEXICON_VERSION}:${n}`,
      lexiconVersion: LEXICON_VERSION,
      arabic,
      transliteration: info.transliteration,
      meaning: info.meaning,
      partOfSpeech: info.partOfSpeech,
      note: "From the curated beginner curriculum (sofer lexicon v1).",
    });
    n++;
  }
  console.log(`seeded ${n} lexicon entries (version ${LEXICON_VERSION})`);
  await closeDb();
}

void main();
