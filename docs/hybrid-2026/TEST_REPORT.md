# Test report

## Baseline before implementation

On Node 22.23.5, before source edits: lesson validation, alphabet validation, TypeScript check, Vitest (12 files / 76 tests), production build, Playwright (35), and hygiene all passed. See `BASELINE.md`.

## Prior implementation checkpoint (Node 24.22.3, 2026-11-16)

| Command | Result |
|---|---|
| `npm run validate:lessons` | PASS — 12 lessons, 48 sentences, unique IDs, references, and token offsets |
| `npm run validate:alphabet` | PASS — 28 letters and 3 diacritics |
| `npm run check` | PASS — client and server TypeScript |
| `npm test` | PASS — 15 files / 85 tests; 1 optional PostgreSQL test file / 2 tests skipped |
| `npm run build` | PASS — client and Express server; initial JS 365 kB and optional Firestore sync chunk 504 kB minified (134 kB gzip) |
| `npm run test:e2e -- --reporter=line` | PASS — 39 Playwright tests including accessibility and viewport flows |
| `npm run hygiene` | PASS — no secrets or forbidden paths |
| `npm audit` | Root: 0; client: 0; server: 4 moderate findings in dev/migration tooling; no high/critical findings after compatible upgrades |

PostgreSQL integration tests require the explicit `SOFER_TEST_DATABASE_URL` opt-in and were skipped in this run. The test no longer truncates a developer database. This is not evidence of live Firebase integration.

## Audit and cleanup checkpoint (Node 26.12.1, 2026-11-19)

| Command | Result |
|---|---|
| `npm run validate:lessons` | PASS — 12 lessons / 48 sentences |
| `npm run validate:alphabet` | PASS — 28 letters / 3 diacritics |
| `npm run check` | PASS — client and server TypeScript after removing the unused Better Auth server implementation |
| `npm test -- --reporter=dot` | PASS — 13 files / 67 passed; 2 optional PostgreSQL tests skipped |
| `npm run build` | PASS — client and server build; existing large optional Firestore sync chunk warning remains |
| `SOFER_E2E_PORT=5174 npm run test:e2e -- --reporter=line` | PASS — 39 Playwright tests; isolated from the user-facing dev server on 5173 |
| `npm run hygiene` | PASS — no secret or forbidden path findings in scanned repository files |
| `npm audit` (root) | PASS — 0 vulnerabilities |
| `npm audit --omit=dev` (server runtime dependencies) | PASS — 0 vulnerabilities |
| `npm audit` (all server dependencies) | FINDING — 4 moderate vulnerabilities in Drizzle migration/dev tooling through `@esbuild-kit`; npm's suggested `--force` downgrade is breaking and was not applied |

The `.env` file was not scanned into this report; retired Token Factory entries were removed locally. The test/build outputs are not evidence of real Firebase inference.

## Submission-readiness rerun (Node 26.12.1, 2026-11-19)

| Command | Result |
|---|---|
| `npm run validate:lessons` | PASS — 12 lessons / 48 sentences |
| `npm run validate:alphabet` | PASS — 28 letters / 3 diacritics |
| `npm run check` | PASS — client and server TypeScript |
| `npm test` | PASS — 13 files / 67 passed; 2 optional PostgreSQL tests skipped |
| `npm run build` | PASS — client and server; Vite reports the optional Firestore sync chunk is 503.54 kB minified / 134.20 kB gzip |
| `npm run test:e2e` | PASS after repairing a stale home selector — 39 Playwright checks, including accessibility and 320–1440 px responsive layouts |
| `npm run hygiene` | PASS — no secrets or forbidden paths |
| `git diff --check` | PASS |

The first full E2E attempt failed because the test still expected the prior home heading and assumed the primary action opened the lesson list. The redesigned action correctly opens the next lesson directly. The test now follows that intended route and the complete E2E suite passes. No real Firebase deployment, cloud inference, on-device inference, or App Check validation has run yet. The Firebase CLI is now authenticated; the selected new project's unique ID is pending.

## Not yet verified

No real Firebase cloud inference, on-device inference, App Check production enforcement, or Firestore emulator rules run has been performed. Unit doubles verify orchestration only. No coverage percentage is reported because coverage instrumentation was not run.
