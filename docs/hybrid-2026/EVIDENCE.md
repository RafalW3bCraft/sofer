# Evidence ledger

| Date | Evidence | Result / limitation |
|---|---|---|
| 2026-11-19 | `git rev-parse HEAD`, `git status --short --branch` | Reviewed clean `main` at `4de0ee365740bb7b73ac095a67300e8369a9bf2b` before audit edits. |
| 2026-11-19 | Local dev server + `curl` to `127.0.0.1:5173/` and `127.0.0.1:3001/api/health` | PASS: both returned HTTP 200; dev server remains running for user inspection. Guest product only; no Firebase config was present. |
| 2026-11-19 | `INDUSTRY_AND_READINESS_AUDIT.md` | Official Devpost requirements, Firebase hybrid docs, public competitor positioning, code gaps and owner setup steps reviewed and recorded. |
| 2026-11-19 | Legacy route reference audit and cleanup | Removed retired Token Factory/Better Auth runtime source, only-dependent tests, smoke command and example variables; removed old Token Factory entries from ignored local `.env`. Dictionary and SQL history retained. |
| 2026-11-19 | Codex ECC marketplace discovery | The initial add collided with an existing marketplace; its official source was verified as `https://github.com/affaan-m/ECC.git`, refreshed without replacement, and used to install the plugin. |
| 2026-11-19 | Post-cleanup validators, TypeScript, unit tests, build, hygiene, E2E and audits | Lesson/alphabet validators pass; `npm run check` passes; 67 unit tests pass and 2 optional DB tests skip; build passes; hygiene passes; 39 E2E pass on port 5174. Root and production-only server audits show 0 findings; all-server audit reports 4 moderate dev/migration-tool findings. |
| 2026-11-19 | ECC Codex plugin setup | Installed and verified one enabled `ecc@ecc` v2.2.3 from the existing official Git marketplace `https://github.com/affaan-m/ECC.git`; project rules are in `AGENTS.md` and `ECC_SETUP.md`. |
| 2026-11-19 | Firebase CLI setup probe | `npx firebase-tools@latest --version` → 15.37.0; `login:list` → no authorized accounts. No project ID or Firebase Web variables are configured; no remote resources were modified. |
| 2026-11-19 | Firebase CLI auth and project inventory | Firebase CLI 15.37.0 `login:list` is authenticated; `projects:list --json` returned two active projects. Owner selected creation of a new project; a valid project ID is pending. No Firebase resources were created. |
| 2026-11-19 | Complete quality rerun after frontend update | Lesson validation PASS (12/48); alphabet PASS (28/3); `npm run check` PASS; `npm test` PASS (67 passed / 2 optional DB skipped); `npm run build` PASS; hygiene PASS. |
| 2026-11-19 | Playwright full E2E after selector repair | Initial run caught a stale home-page assertion after the home CTA began linking directly to the next lesson. Updated the test to match intended navigation; full `SOFER_E2E_PORT=5197 npm run test:e2e` PASS — 39 checks, including seven axe page audits and viewport checks at 320, 375, 768, 1024, and 1440 px. |
| 2026-11-19 | Hackathon rules and Firebase current docs | Official rules confirm runtime Firebase AI Logic implementation, a working test URL, public open-source repository, and YouTube video ≤3 minutes in English or with English subtitles. Current hybrid guide says on-device web inference requires Chrome desktop 139+ and `initializeDeviceModel()` after user action; response `inferenceSource` identifies actual source. |
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
