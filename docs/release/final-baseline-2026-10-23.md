# Final baseline — 2026-10-23 (pre-push)

**Local HEAD:** (set at push time; this doc committed before push)
**origin/main at last fetch:** `1d48212b5bc9e3d68199bc704010ab26c019ff48`
**Divergence:** local ahead 13, behind 0.

## Commits in this release (13 unpushed)

| SHA | Subject |
|-----|---------|
| 13fe742 | fix: production startup, dotenv loader, lesson completion, deep-link resume, reactive speech, hardened hygiene |
| a514d95 | docs: release artifacts — feature matrix, OmniLangTutor parity, live smoke, submission check |
| 08c410a | fix(typography): bundled webfont + annotateArabic so all inline Arabic renders glyphs |
| da81d2f | docs(release): G1-G10 release matrix + final release report |
| 8a8639b | chore(env): bump default TOKENFACTORY_TIMEOUT_MS to 30000ms |
| c4c2201 | fix(provider): default to verified Nebius Token Factory endpoint; CI; provenance doc |
| 7dc424c | feat(ux): first-use hint on lesson player |
| 305a8d2 | security: self-host Arabic webfont; CSP/XFO/nosniff/referrer headers |
| 4ffb9d1 | docs(release): re-verify live Nebius smoke |
| 66b71c2 | security(deps): react-router-dom 6.30.6 → 7.18.4 (GHSA-wrjc-x8rr-h8h6, GHSA-337j-9hxr-rhxg) |
| 75f53fa | chore(runtime): Node >=22 (24 LTS preferred), CI matrix 22+24, .nvmrc |
| 764478b | a11y: axe-core WCAG 2.2 A/AA suite; fix aria-allowed-attr + color-contrast |
| d57f7c8 | security(ai): HTTPS host allowlist on provider URL (SSRF guard) + 9 tests |
| fca7fc8 | deploy: Dockerfile (non-root, node:24-alpine, healthcheck) verified locally |

All 13 belong to the submission. No force-push, no history rewrite.

## Tested runtime

- Node v26.7.0 (this machine), npm 11.19.0 — full gate PASS.
- CI matrix targets Node 22 + 24 (first real run after push).
- Docker: image built on Docker 29.7.2, container verified (non-root uid 100).

## Full gate (all exit 0, run on HEAD d57f7c8 + fca7fc8 docs)

- npm ci ×3 · validate:lessons (3/7) · validate:alphabet (28/3) · tsc ×2
- vitest **67/67** (11 files)
- Playwright **35/35** (lesson flow, tricky deep links, 25 viewports, 5 axe-core WCAG 2.2 A/AA — zero automated violations after fixes)
- build (client 277 kB / gzip ~85 kB; server esbuild) · hygiene PASS
- Production smoke (node + Docker): routes 200, /api/unknown 404, /api/health 200, CSP present, no-key 503 fallback, invalid body 400
- Live Nebius smoke: PASS (30 models, chat 200) — authorized key, no secrets in artifacts
- AMD Radeon Cloud: 401 with the Nebius key (expected; different provider; documented, not claimed)
- Dependency audit: **0 vulnerabilities** root/client/server (--omit=dev)

## Unverified claims (honest labels)

- Proficient-MSA linguistic review: NOT VERIFIED (no reviewer available).
- External first-time-user testing: NOT VERIFIED (no testers; operator + e2e substitute).
- Public HTTPS deployment: NOT VERIFIED (optional; Docker verified locally only).
- GitHub Actions green: NOT VERIFIED until first post-push run.
- Devpost video/fields/submission: participant-only, NOT VERIFIED.

## Blockers

None technical. Push authorized; proceeding. Remaining external actions are participant-only (video, Devpost form, optional hosting).
