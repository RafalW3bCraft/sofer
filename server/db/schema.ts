/**
 * PostgreSQL schema for the production-platform slice (Drizzle ORM).
 *
 * Scope: ONLY mutable account data lives here. Curated lesson content stays
 * versioned static JSON in client/src/content — it is not duplicated into
 * the database. The anonymous local-first learning loop on main never
 * touches these tables.
 *
 * Auth tables (user/session/account/verification) follow Better Auth's
 * documented core schema so the drizzleAdapter can manage them directly.
 */
import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Better Auth core tables
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// sofer application tables
// ---------------------------------------------------------------------------

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  showTranslit: boolean("show_translit").notNull().default(false),
  speechRate: integer("speech_rate").notNull().default(100), // percentage 50–200
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One row per submitted answer. Idempotency: the client sends a stable
 * idempotencyKey per (user, lesson, sentence) attempt; unique constraint
 * makes retried/double submissions no-ops. Re-answers create a new row only
 * when the key differs, and progress derivation counts unique sentences.
 */
export const lessonAttempts = pgTable(
  "lesson_attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    sentenceId: text("sentence_id").notNull(),
    correct: boolean("correct").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    answeredAt: timestamp("answered_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("lesson_attempts_idem").on(t.userId, t.idempotencyKey),
    index("lesson_attempts_user_lesson").on(t.userId, t.lessonId),
  ]
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    // A lesson completes only when every required sentence has an attempt
    // (mirrors the local-first V2 semantics in shared/schemas.ts).
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("lesson_progress_user_lesson").on(t.userId, t.lessonId)]
);

export const trickyTokens = pgTable(
  "tricky_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Stable token identity: <lessonId>:<sentenceId>:<tokenIndex>
    tokenId: text("token_id").notNull(),
    markedAt: timestamp("marked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("tricky_tokens_user_token").on(t.userId, t.tokenId)]
);

/** Review events for the spaced-review queue (no fake ML — deterministic). */
export const reviewEvents = pgTable(
  "review_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tokenId: text("token_id").notNull(),
    correct: boolean("correct").notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("review_events_user_token").on(t.userId, t.tokenId)]
);

/**
 * Minimal audit trail. MUST NOT store tokens, credentials, request bodies,
 * or learner free text — only coarse action metadata.
 */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(), // e.g. "account.created", "account.deleted", "progress.imported"
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_events_user").on(t.userId)]
);

/**
 * Curated starter lexicon for the dictionary lookup. Versioned and seeded
 * from reviewed content; NOT a full dictionary (documented limitation).
 */
export const lexiconEntries = pgTable(
  "lexicon_entries",
  {
    id: text("id").primaryKey(),
    lexiconVersion: integer("lexicon_version").notNull(),
    arabic: text("arabic").notNull(),
    transliteration: text("transliteration").notNull(),
    meaning: text("meaning").notNull(),
    partOfSpeech: text("part_of_speech").notNull(),
    note: text("note"),
  },
  (t) => [index("lexicon_arabic").on(t.arabic)]
);
