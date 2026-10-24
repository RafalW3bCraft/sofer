# sofer production platform — technical spec

## Architecture

Keep the existing Vite/React Router 7 client + Express server + shared Zod
schemas layout. New modules:

- `server/db/schema.ts` — Drizzle schema: Better Auth core tables
  (`user`, `session`, `account`, `verification`) + app tables
  (`user_preferences`, `lesson_attempts`, `lesson_progress`,
  `tricky_tokens`, `review_events`, `audit_events`, `lexicon_entries`).
- `server/db/index.ts` — postgres.js pool (max 5), Drizzle wrapper, optional
  at runtime: `getDb()` returns null when `DATABASE_URL` is unset.
- `server/db/migrations/` — drizzle-kit generated SQL + snapshot journal.
- `server/db/seed-lexicon.ts` — idempotent lexicon v1 seed from curated
  lesson JSON.
- `server/lib/auth.ts` — Better Auth 1.7.x with the Drizzle adapter
  (provider `pg`), email+password, 7-day sessions, cookie prefix `sofer`,
  HttpOnly, sameSite=Lax, `secure` auto when baseURL is https.
- `server/routes/me.ts` — authenticated `/api/me/*` (see Routes).
- `server/routes/dictionary.ts` — public `/api/dictionary/lookup`.
- `server/index.ts` — mounts auth handler + routers only when
  `DATABASE_URL` is set; anonymous mode unchanged otherwise.

## Database

PostgreSQL 17 (docker-compose.dev.yml for local dev). Migrations via
drizzle-kit; apply with `npx drizzle-kit push` (dev) or the generated SQL in
`server/db/migrations/` for managed environments. Rollback guidance: each
migration is additive in this slice; restore-from-backup is the rollback
strategy (documented in the runbook).

Key constraints:
- `lesson_attempts (user_id, idempotency_key)` UNIQUE — client retries are
  no-ops.
- `lesson_progress (user_id, lesson_id)` UNIQUE.
- `tricky_tokens (user_id, token_id)` UNIQUE; `token_id` is
  `<lessonId>:<sentenceId>:<tokenIndex>`.
- All app tables FK to `user.id` ON DELETE CASCADE, except `audit_events`
  (SET NULL, keeps coarse history without user data).

## AuthN/Z model

- `userId` is derived ONLY from the verified Better Auth session cookie via
  `resolveSession()`. Request JSON/params/query can never select another
  user (test: spoofed `userId` in body is ignored).
- CSRF: same-origin SPA + `sameSite=Lax` cookies; no cross-site POSTs.
  State-changing routes require the session cookie; there are no ambient
  credentials besides the cookie.
- Sessions expire in 7 days; invalid/forged cookies return 401.

## Routes

Public:
- `GET /api/health` — unchanged.
- `POST /api/ai/explain` — unchanged (server-side key, allowlisted hosts).
- `GET /api/dictionary/lookup?q=...` — sanitized (100-char cap, control
  chars stripped), diacritic/alef-insensitive match, LIKE-escaped, limit 20,
  returns `lexiconVersion`. 503 when DB absent, 400 on invalid query.

Authenticated (all under `/api/me`, 401 unauthenticated, 503 when DB
absent):
- `GET /` — profile.
- `GET|PATCH /preferences` — `showTranslit`, `speechRate` (50–200).
- `POST /attempts` — Zod-validated, idempotent (201 created / 200 duplicate).
- `GET /attempts` — caller's attempts, chronological, limit 1000.
- `GET /progress` — per-lesson completion + attempt aggregates.
- `GET|PUT /tricky-tokens`, `DELETE /tricky-tokens/:tokenId`.
- `POST /reviews` — record a review event.
- `GET /reviews/queue` — deterministic queue: never-reviewed first, then
  least-recently reviewed. No ML.
- `POST /import-local` — guest progress import; REQUIRES `confirm: true`;
  transactional; idempotent via deterministic keys
  (`import:<lessonId>:<sentenceId>:<answeredAt>`); writes an audit event.
- `DELETE /` — deletes the user row; cascades remove all data; audit event
  written first.

Error shape: `{ error, reason, message }` with stable reasons
(`feature_unavailable`, `unauthenticated`, `invalid_request`). Internal
details are never returned.

Auth handler: `ALL /api/auth/*` bridges Express to Better Auth's fetch-style
handler, forwarding the already-parsed JSON body.

## Configuration

- `DATABASE_URL` (optional) — enables the whole slice.
- `BETTER_AUTH_SECRET` — required in real deployments.
- `BETTER_AUTH_URL` — defaults to `http://127.0.0.1:3001` (dev).

## Testing

- `tests/integration/production-platform.test.ts` — 9 tests against real
  ephemeral Postgres (docker container); auto-skips when DB is unreachable
  so the hackathon gate never depends on Docker. Covers: sign-up + /api/me,
  401 + userId-spoof immunity, two-user isolation + forged cookie, attempt
  idempotency, import confirm + re-import no-op, deterministic review queue,
  account deletion, dictionary seed/lookup/sanitization/SQL-injection,
  invalid-payload 400s.
- Verified locally 2026-10-24: 76/76 vitest (incl. the 9 above), 35/35
  Playwright e2e, tsc clean, production build green, drizzle-kit push
  idempotent, lexicon seeded (17 entries, version 1).

## Known limitations (honest)

- No client UI for accounts yet — API only.
- No email verification / password recovery flow (needs mail infra).
- Lexicon is 17 curated entries — NOT a full dictionary.
- No rate limiting specific to auth endpoints yet (Better Auth defaults
  apply; global policy unchanged from main).
- Production HTTPS deployment: NOT VERIFIED (no host authorized).
