# Sofer Hybrid AI 2026 baseline

## Repository snapshot

- Repository: `RafalW3bCraft/sofer`
- Baseline commit: `55f613111048cb7edccfea2da9edda398650d4c2`
- Branch: `main`; worktree was clean before this implementation began.
- Snapshot date: 2026-11-16.
- Runtime at inspection: Node 20.19.2, npm unavailable; `.nvmrc` requested Node 22. A task-local Node 22.23.5/npm 10.9.9 installation enabled the baseline run. Firebase JS SDK 13.3.0 was then selected; its transitive AI packages require Node >=24.12, so the project runtime and CI were moved to Node 24.

## Existing product at baseline

- React 18/Vite SPA with home, lesson list/player, alphabet and progress routes.
- Three A1 lessons and seven total sentences, with tappable Arabic tokens, word annotations, comprehension questions and deterministic grading.
- Local progress schema v2 with v1 migration, per-sentence answers, tricky-token review and completion calculations.
- Optional server-side Token Factory tutor endpoint with request/response validation, timeout, host allowlist, rate limiting and curated UI fallback.
- Express server with conditional Better Auth + PostgreSQL/Drizzle account sync and a database-backed dictionary.
- Existing accessibility, Arabic Unicode, migration, API and browser-flow tests; Docker production image and GitHub Actions CI.
- No Firebase SDK/config, Firebase Hosting config, Firestore rules, or Firebase AI Logic integration existed at baseline.

## Baseline checks

Run on Node 22.23.5 before application source changes (all commands completed):

| Command | Result |
|---|---|
| `npm run validate:lessons` | PASS — 3 lessons, 7 sentences |
| `npm run validate:alphabet` | PASS — 28 letters, 3 diacritics |
| `npm run check` | PASS — client and server TypeScript |
| `npm test` | PASS — 12 files, 76 tests |
| `npm run build` | PASS — Vite client and Express server |
| `npm run test:e2e` | PASS — 35 Playwright tests, including axe and 320px viewport checks |
| `npm run hygiene` | PASS — no secret/forbidden-path findings |

`npm ci` reported npm audit findings in the pre-existing dependency sets: root 12 (3 critical, 3 high, 6 moderate), client 3 (2 high, 1 moderate), server 6 (2 high, 4 moderate). Details are captured in `TEST_REPORT.md` and `SECURITY_REVIEW.md`; dependency upgrades must preserve the verified test baseline.

## Baseline limitations

- The lesson validator hard-coded seven sentences; the schema constrained topic values and sentence count.
- AI was a single Express/Token Factory endpoint; no real Firebase inference source or device preparation state existed.
- The server CSP allowed only same-origin `connect-src`.
- Firebase project credentials, production App Check registration, model behavior on Arabic, and deployment access were not present in the repository/environment.
- No native Arabic reviewer is available for this work; candidate content must remain marked as draft unless its provenance and linguistic confidence are documented.
