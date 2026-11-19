# Implementation status

Updated: 2026-11-19

## Complete in this checkpoint

- Recorded the clean baseline at `55f613111048cb7edccfea2da9edda398650d4c2` and all seven baseline checks.
- Selected Firebase JS SDK 13.3.0. Its AI package requires Node >=24.12; runtime, CI, Docker notes, and `.nvmrc` now target Node 24.
- Implemented Firebase App Check initialization, Firebase AI Logic provider, all four inference modes, user-gesture device preparation, actual inference-source reporting, bounded context, structured output validation, error fallback, and abort handling.
- Replaced the active Token Factory tutor route in the SPA; removed the server route mount. Historical route/provider modules remain unused for reference/tests. Retained Express dictionary behavior when PostgreSQL is configured.
- Added optional Firebase Auth, explicit local-progress import/merge, Firestore owner-only rules, settings, export/reset controls, and removal tombstones for cross-device tricky-token sync.
- Expanded the versioned pack to 12 lessons / 48 sentences: 3 trusted lessons / 7 sentences, plus 9 draft lessons / 41 candidate sentences. Drafts are labeled, not AI-grounded, and not graded.
- Added deterministic vocabulary recall, sentence reconstruction, and a simple local spaced-review scheduler.
- Prepared Firebase Hosting/emulator config, CSP/security headers, and required architecture/setup/deployment/test/security/demo/disclosure docs.
- Updated Vite to 6.4.6, Vitest to 5.1.0, and Zod to 4.6.7. Root/client audits report zero vulnerabilities; server has four moderate dev/migration-tool findings and no high/critical findings.

## Verification complete

- `npm run validate:lessons`: PASS — 12 lessons / 48 sentences.
- `npm run validate:alphabet`: PASS — 28 letters / 3 diacritics.
- `npm run check`: PASS — client and server TypeScript.
- `npm test`: PASS — 15 files / 85 tests; two PostgreSQL integration tests skipped unless `SOFER_TEST_DATABASE_URL` is explicitly configured.
- `npm run build`: PASS — client and server; initial JS is 365 kB, with a 504 kB Firestore sync chunk loaded only when requested.
- `npm run test:e2e -- --reporter=line`: PASS — 39 Playwright tests, including axe on settings/practice and responsive viewports.
- `npm run hygiene`: PASS.

## Blocked on owner/project or hardware setup

- Real cloud inference: needs existing-project web config, Firebase AI Logic enabled, project provider/model/billing access, and a registered local App Check debug token.
- Production AI: needs production reCAPTCHA Enterprise App Check registration and enforcement enabled in Firebase Console.
- Real on-device inference and Arabic quality evaluation: needs supported Chrome desktop 139+ hardware and model availability. No local/cloud runtime result has been claimed.
- Firestore rules emulator/project verification: rules are authored but not emulator-tested or deployed.
- Hosting: prepared, not deployed. The Hosting rewrite expects Cloud Run service `sofer-api` in `us-central1`; production URL remains unset.
- Candidate Arabic content: reviewer unavailable, so only 3 original lessons / 7 sentences are trusted. The remaining 9 lessons / 41 sentences must receive qualified review before release as learning content.
- Hackathon owner eligibility and submission remain owner-confirmed.

## 2026-11-19 audit checkpoint

- Added an official-rules cross-check, competitor/product scan, owner Firebase setup steps, and prioritized gap register in `INDUSTRY_AND_READINESS_AUDIT.md`.
- Launched the guest-first app locally at `http://127.0.0.1:5173/`; local client and `/api/health` returned HTTP 200. Firebase AI stays unavailable because the ignored root `.env` currently has no Firebase Web configuration.
- Removed the retired Token Factory tutor endpoint/provider, its isolated tests and smoke script, the unused Better Auth implementation/dependency, and obsolete Token Factory sample variables. Preserved the dictionary route, SQL schema/migration history, and ignored `.env`.
- ECC Codex plugin `ecc@ecc` v2.2.3 is installed and enabled from the verified official marketplace. Repo-specific rules and limitations are recorded in `AGENTS.md` and `ECC_SETUP.md`; restart/reload Codex for the plugin skills to appear in a fresh session. No MCP credentials/hooks were enabled.
- Added an optional `SOFER_E2E_PORT` to Playwright so tests can run on an isolated port while the local app remains open.
- Current working tree contains these audit/cleanup edits; no commit or deployment was made.
- Post-cleanup checks: lesson/alphabet validation, TypeScript, unit tests (67 pass / 2 optional DB skips), build, hygiene and 39 E2E tests passed. Root audit and server production-only audit report 0 findings; full server dev-tool audit still reports 4 moderate `@esbuild-kit`/Drizzle migration-tool findings. See `TEST_REPORT.md`.
- Removed obsolete Token Factory settings from the ignored local `.env`; its remaining variable names were checked without printing values. The app was restarted and both local endpoints returned HTTP 200.
- Firebase setup investigation: Firebase CLI 15.37.0 is available via Corepack/npm and is authenticated to the owner's Google account. The owner chose a new project; a valid unique project ID is still being confirmed. No `.firebaserc` target or Firebase Web variables are configured. Do not create a Firestore database until its edition/location are selected.
- Frontend checkpoint: home is now a local-progress dashboard with a trusted Arabic sample, continue-learning action, and links to alphabet/practice; responsive navigation and layout updated. Production build and 320–1440px E2E viewports pass.
- Full verification rerun on Node 26.12.1: lesson/alphabet validators, TypeScript, 67 unit tests (2 optional DB skips), production build, 39 Playwright E2E checks, and hygiene pass. The E2E selector was updated to follow the new home CTA directly into its next lesson. Build retains the existing >500 kB optional Firestore chunk warning.

## Next actions

1. Confirm a unique project ID; create the Firebase project, register the Web app, provision AI Logic, and configure production App Check before building Hosting assets.
2. Deploy Hosting after config/build validation; configure the existing Cloud Run API rewrite only with a deployable service and its required PostgreSQL connectivity.
3. Run supported Chrome desktop local inference and cloud inference, record SDK `inferenceSource`, Arabic-language observations, and production App Check checks.
4. Run Firestore Emulator rule tests; choose database edition/location before provisioning optional sync.
5. Arrange Arabic review of candidate pack; promote only reviewed entries with provenance.
6. Resolve or explicitly accept the four moderate server dev-tool audit findings; rerun all gates.
7. Finish the timed English submission video with actual app footage and publish the verified video on YouTube; then record the final public URL.
