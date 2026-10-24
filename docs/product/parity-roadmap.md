# sofer ↔ OmniLangTutor — clean-room parity roadmap

Predecessor `OmniLangTutor/` was read for feature inventory only. No code was
transplanted; the hackathon submission contains none of its implementation.
"Predecessor status" reflects what its source actually implements vs stubs,
per the existing audit in `docs/release/omnilangtutor-parity.md`.

## Matrix

| Feature family | Predecessor status | sofer now (P0 hackathon) | Production milestone | Priority | Acceptance test |
|---|---|---|---|---|---|
| Interactive sentence/word blocks (tappable tokens) | implemented (position-aligned) | SHIPPED — offset-anchored tokens, curated annotation | — | P0 | 35 e2e incl. token panel |
| Curated curriculum | implemented (small) | SHIPPED — 3 lessons / 7 MSA sentences, Zod-validated | P1 expand to 50+ reviewed sentences | P0/P1 | validate:lessons; MSA review NOT VERIFIED |
| Progress tracking | partial | SHIPPED — localStorage V2, exact resume, accuracy | P1 account-backed sync (Postgres) | P0/P1 | progress-domain tests 15/15 |
| Dictionary search | implemented | ABSENT | P1 — server-side lexicon, sanitized queries | P1 | API + UI tests |
| Dictionary import/management | partial/stub | ABSENT | P2 — with sanitization + moderation | P2 | import pipeline tests |
| Profiles/auth | implemented (passport) | ABSENT (anonymous local-first by design) | P1 — managed auth, server-side session verification, account deletion | P1 | auth integration tests, 2-user denial |
| Settings/preferences | partial | PARTIAL — transliteration toggle (session) | P1 persisted preferences | P1 | preferences API tests |
| Dashboards/analytics | partial (fake-risk) | SHIPPED minimal — honest progress stats only | P1 richer honest analytics | P1 | no fake metrics test |
| AI conversation/buddy | implemented (simulated) | ABSENT | P2 — scoped, rate-limited, untrusted output | P2 | injection + quota tests |
| AI explanations | simulated | SHIPPED — real Nebius Token Factory, curated fallback | P1 quotas/caching | P0/P1 | mock 9/9 + live smoke PASS |
| Generated sentences | implemented (unverified quality) | ABSENT | P2 — reviewed-before-publish only | P2 | content review gate |
| Cultural context | partial | ABSENT | P2 modules | P2 | content tests |
| Speech (TTS) | implemented | SHIPPED — browser TTS, reactive voice status, honest fallback | P1 keep | P0 | speech-status tests 5/5 |
| Speech recognition/scoring | stub/absent | ABSENT | P2 — only with real scoring evidence | P2 | NOT before real input tests |
| Admin content tools | stub | ABSENT | P2 with RBAC | P2 | RBAC tests |

**Counts:** shipped now 7 families (tokens, curriculum, progress, analytics-lite,
AI explanations, TTS, honest fallbacks); partial 1 (settings); absent 8
(dictionary×2, auth, conversation, generation, culture, recognition, admin).

## P1 production slice (feature/production-platform branch)

PostgreSQL + Drizzle: `users`, `user_preferences`, `attempts`,
`lesson_progress`, `tricky_tokens` (+ later `review_events`, `audit_events`).
Lessons stay versioned static JSON — only mutable account data goes to the DB.
API: `/api/me`, `/api/me/preferences`, `/api/me/progress`, `/api/me/attempts`,
`/api/me/tricky-tokens`, `DELETE /api/me`. Anonymous loop keeps working with
no DB. Deterministic merge on first login (no silent overwrite of local
progress). Docker Compose for local Postgres. All endpoints Zod-validated,
authorized, integration-tested incl. two-user denial and restart persistence.
Status (2026-10-24): **SERVER SLICE IMPLEMENTED + VERIFIED LOCALLY** on
`feature/production-platform` — schema, migrations, Better Auth
(email+password, Drizzle pg adapter), `/api/me/*` (preferences, attempts
with idempotency, progress, tricky tokens, review queue, confirmed guest
import, account deletion), public `/api/dictionary/lookup` with seeded v1
lexicon, docker-compose Postgres, 9/9 ephemeral-DB integration tests green
(76/76 vitest overall, 35/35 e2e, tsc/build/hygiene green). Client account
UI, email verification, and production HTTPS deployment: NOT VERIFIED /
deferred. Hackathon `main` is untouched and remains the submission build.
