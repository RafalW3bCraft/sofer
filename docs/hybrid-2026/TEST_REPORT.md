# Test report

## Baseline before implementation

On Node 22.23.5, before source edits: lesson validation, alphabet validation, TypeScript check, Vitest (12 files / 76 tests), production build, Playwright (35), and hygiene all passed. See `BASELINE.md`.

## Current checkpoint (Node 24.22.3)

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

## Not yet verified

No real Firebase cloud inference, on-device inference, App Check production enforcement, or Firestore emulator rules run has been performed. Unit doubles verify orchestration only. No coverage percentage is reported because coverage instrumentation was not run.
