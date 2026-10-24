# sofer production platform — PRD (feature/production-platform)

Status: IMPLEMENTED (server-side slice) / NOT VERIFIED in production.
Branch: `feature/production-platform`. Do NOT merge to `main` before the
hackathon submission is complete.

## Scope

Anonymous local-first learning (hackathon POC on `main`) stays fully
functional with NO database. The production slice adds optional, opt-in
accounts backed by PostgreSQL so learners can keep progress across devices
and browsers.

## User stories

1. As a guest, I can use every lesson, the alphabet, TTS, the progress page
   and the optional AI tutor without an account and without any DB.
2. As a new user, I can create an email+password account and stay signed in
   across sessions via a secure HttpOnly cookie.
3. As a returning user, my server-side attempts/progress/tricky tokens are
   visible on any device I sign in to.
4. As a user, I can explicitly import my guest (localStorage) progress on
   first sign-in. Import is never automatic; it requires `confirm: true` and
   is idempotent (re-import is a no-op).
5. As a user, I can delete my account and all associated data is actually
   removed (cascade).
6. As any user, I can look up words in a small curated lexicon with
   diacritic-insensitive matching (documented as NOT a full dictionary).

## Non-goals for this slice

- No frontend account UI yet (server API only). Client screens
  (sign-in/sign-up/settings/review UI) are a follow-up milestone.
- No email verification (no mail infra in dev). `requireEmailVerification:
  false` is explicit; a real deployment must wire `sendVerificationEmail`.
- No AI conversation, speech scoring, CEFR claims, or fake proficiency
  metrics.
- No full dictionary: seeded lexicon is version 1, sourced from curated
  lesson tokens only.

## Success criteria

- All 9 integration tests pass against ephemeral PostgreSQL
  (`tests/integration/production-platform.test.ts`).
- Hackathon gate stays green without `DATABASE_URL` (anonymous mode).
- Two-user isolation, idempotency, CSRF-via-sameSite=Lax, Zod validation,
  SQL-injection safety, account deletion verified in tests.
