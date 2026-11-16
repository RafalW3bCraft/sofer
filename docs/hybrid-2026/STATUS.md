# Implementation status

Updated: 2026-11-16

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

## Next actions

1. Owner supplies existing Firebase web config and local App Check setup, then record real cloud and device inference results.
2. Run Firestore emulator rules tests and verify App Check enforcement in the project.
3. Arrange Arabic review of candidate pack; promote only reviewed entries with provenance.
4. Resolve or explicitly accept the four moderate server dev-tool audit findings; re-run all gates.
5. Review production CSP/network behavior, deploy only after explicit authorization, and record the verified public URL.
