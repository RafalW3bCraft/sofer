/**
 * Dictionary lookup against the versioned starter lexicon. Public (no auth
 * required — the lexicon is curated non-personal data), rate-limited by the
 * same global middleware policy as the rest of the API surface. NOT a full
 * dictionary; results carry the lexicon version for honest attribution.
 */
import { Router, type Request, type Response } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { lexiconEntries } from "../db/schema.js";

const MAX_QUERY_LEN = 100;

// Simple Arabic/Latin sanitization: trim, cap length, strip control chars.
function sanitizeQuery(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const q = raw.replace(/[-]/g, "").trim();
  if (!q || q.length > MAX_QUERY_LEN) return null;
  return q;
}

export function createDictionaryRouter(): Router {
  const router = Router();

  router.get("/lookup", async (req: Request, res: Response) => {
    const db = getDb();
    if (!db) {
      res.status(503).json({
        error: "dictionary_failed",
        reason: "feature_unavailable",
        message: "The dictionary is not configured on this server.",
      });
      return;
    }
    const q = sanitizeQuery(req.query.q);
    if (!q) {
      res.status(400).json({
        error: "dictionary_failed",
        reason: "invalid_request",
        message: `Provide ?q= with 1–${MAX_QUERY_LEN} non-control characters.`,
      });
      return;
    }
    // Diacritic/alef-insensitive matching: strip Arabic diacritics
    // (U+064B–U+0652, U+0670, shadda U+0651 stays to preserve gemination
    // semantics? — for a beginner lexicon we strip it too, U+0651) and
    // normalize alef variants (ٱ آ أ إ → ا) and ى → ا on BOTH sides, so a
    // learner typing bare letters finds the fully-vowelled curated form.
    // This is character normalization only — NOT morphological analysis.
    const DIACRITICS = "\\u064B\\u064C\\u064D\\u064E\\u064F\\u0650\\u0651\\u0652\\u0670";
    const stripDiacritics = (s: string) =>
      s.replace(new RegExp(`[${DIACRITICS}]`, "g"), "");
    const normalizeAlef = (s: string) =>
      s.replace(/[ٱآأإى]/g, "ا");
    const normalize = (s: string) => normalizeAlef(stripDiacritics(s));
    const pattern = `%${normalize(q).replace(/[%_]/g, (m) => `\\${m}`)}%`;
    // translate() strips the same diacritics from the stored form in SQL.
    const rows = await db
      .select({
        arabic: lexiconEntries.arabic,
        transliteration: lexiconEntries.transliteration,
        meaning: lexiconEntries.meaning,
        partOfSpeech: lexiconEntries.partOfSpeech,
        note: lexiconEntries.note,
        lexiconVersion: lexiconEntries.lexiconVersion,
      })
      .from(lexiconEntries)
      .where(
        sql`(
          replace(translate(${lexiconEntries.arabic}, ${"ًٌٍَُِّْٰٱآأإى"}, ${"          ا"}), ' ', '')
            LIKE ${pattern} ESCAPE '\\'
          OR ${lexiconEntries.transliteration} ILIKE ${pattern} ESCAPE '\\'
          OR ${lexiconEntries.meaning} ILIKE ${pattern} ESCAPE '\\'
        )`
      )
      .limit(20);
    res.json({ query: q, count: rows.length, entries: rows });
  });

  return router;
}
