# Evidence ledger

| Date | Evidence | Result / limitation |
|---|---|---|
| 2026-11-16 | `git status --short --branch`, `git rev-parse HEAD` | Clean baseline `main` at `55f613111048cb7edccfea2da9edda398650d4c2`. |
| 2026-11-16 | Baseline validators/check/test/build/E2E/hygiene | All passed before source edits; 12 files / 76 unit tests and 35 Playwright tests. See `BASELINE.md`. |
| 2026-11-16 | `npm run validate:lessons` | PASS: 12 lessons / 48 sentences; 3 trusted lessons / 7 sentences and 9 draft lessons / 41 sentences. |
| 2026-11-16 | `npm run validate:alphabet` | PASS: 28 letters / 3 diacritics. |
| 2026-11-16 | `npm run check` | PASS: client + server TypeScript on Node 24.22.3. |
| 2026-11-16 | `npm test` | PASS: 15 files / 85 tests; 2 optional PostgreSQL tests skipped. Includes hybrid service doubles, sync merge/tombstones, context, and review scheduling. |
| 2026-11-16 | `npm run build` | PASS: Vite 6.4.6 and server bundle. Initial JS chunk 365 kB; explicit Firestore sync chunk 504 kB minified / 134 kB gzip. |
| 2026-11-16 | `npm run test:e2e -- --reporter=line` | PASS: 39 Playwright tests; settings/practice axe checks and responsive 320–1440px pages included. |
| 2026-11-16 | `npm run hygiene` | PASS: tracked, working-tree, and untracked files scanned. |
| 2026-11-16 | `npm audit` root/client/server | Root 0, client 0, server 4 moderate in server migration/dev tooling. No high or critical remain. |
| 2026-11-16 | Firebase JS SDK package metadata | Firebase 13.3.0; `@firebase/ai` requires Node >=24.12. |
| 2026-11-16 | Firebase hybrid Web guide | Chrome desktop 139+ for on-device web path; single-turn device generation; `initializeDeviceModel()` follows a user gesture. https://firebase.google.com/docs/ai-logic/hybrid/web/get-started |
| 2026-11-16 | Firebase supported models page | `gemini-3.5-flash-lite` listed as a stable Firebase AI Logic model; project/provider access still unconfirmed. https://firebase.google.com/docs/ai-logic/models |
| 2026-11-16 | Firebase App Check guidance | Production web attestation uses reCAPTCHA Enterprise; enable AI Logic enforcement. https://firebase.google.com/docs/ai-logic/app-check |

Real Firebase cloud and on-device results: **not run**. No project config is present. No inference claim is based on a test double or selected mode.
