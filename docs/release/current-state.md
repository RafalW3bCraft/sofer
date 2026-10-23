# Current state — provenance and reconciliation

**Generated (UTC):** 2026-10-23T05:50Z
**Generator:** Hermes, executing `sofer_hermes_strict_release_prompt_2026-10-23.md`.

## Git provenance

- Local `main` HEAD at audit start: `8a8639b0eba1672a48ef92deea1d9d6e71530ecb`
  (`chore(env): bump default TOKENFACTORY_TIMEOUT_MS to 30000ms`)
- `origin/main` at audit start (after `git fetch origin`):
  `1d48212b5bc9e3d68199bc704010ab26c019ff48`
  (`fix(hygiene): exempt .env.example from secret scan; tighten value regex`)
- Divergence: `git rev-list --left-right --count origin/main...HEAD` → `0 5`
  (local 5 ahead, 0 behind). The five local commits match the SHAs expected
  by the release directive and are all intentional release work:

  | SHA | Subject |
  |-----|---------|
  | `13fe742` | fix: production startup, dotenv loader, lesson completion, deep-link resume, reactive speech, hardened hygiene |
  | `a514d95` | docs: release artifacts — feature matrix, OmniLangTutor parity, live smoke, submission check |
  | `08c410a` | fix(typography): bundled webfont + annotateArabic so all inline Arabic renders glyphs |
  | `da81d2f` | docs(release): G1-G10 release matrix + final release report |
  | `8a8639b` | chore(env): bump default TOKENFACTORY_TIMEOUT_MS to 30000ms |

- All five belong to the submission. **They remain unpushed as of this
  writing** — pushing requires participant authorization (Phase 6 gate).

## Working-tree state at audit start

Four files carried uncommitted modifications: `package.json`,
`package-lock.json`, `client/package.json`, `client/package-lock.json`.
The diff was an uncommitted set of major-version dependency bumps
(react-router-dom 6→7, vite 5→6, vitest 2→3, @vitest/coverage-v8 2→3).
Per the directive's "no blind major version bumps immediately before
submission" rule, these were **stashed, not committed**:

- Backup patch: `~/.hermes/cache/scratch/sofer-backup/uncommitted-dep-bumps.patch`
- Backup copies: `~/.hermes/cache/scratch/sofer-backup/{root-,}package*.json`,
  `~/.hermes/cache/scratch/sofer-backup/client/package*.json`
- `git checkout --` restored the committed manifests; the working tree is
  now clean apart from the release-prompt markdown (untracked, not part of
  the repo).

The react-router 6 advisories (GHSA-wrjc-x8rr-h8h6, GHSA-337j-9hxr-rhxg,
both moderate) are noted in `docs/release/final-report.md`'s risk section.
The SSR-hydration advisory does not apply (no SSR); the open-redirect
advisory affects `<Link>`/navigation with backslash URLs and is accepted
risk for the POC window. The stashed v7 bump can be re-applied and
re-tested after submission.

## Fresh-clone verification (Node v26.7.0, npm 11.19.0, Linux)

Cloned the local repo to a disposable directory and ran the full gate.
All commands exited 0:

| Command | Result |
|---------|--------|
| `npm ci` (root, client, server) | OK (npm warned that esbuild postinstall scripts are gated by the local allowScripts policy; builds still succeeded because esbuild's optional fallback was already present — on CI `npm ci` runs with default policy and installs normally) |
| `npm run validate:lessons` | OK — 3 lessons, 7 sentences, 3 unique lesson ids, 7 unique sentence ids |
| `npm run validate:alphabet` | OK — 28 unique letters, 3 diacritics |
| `npm run check` (tsc client + server) | OK |
| `npm test` (Vitest) | **58/58 passed** (10 files) |
| `npm run build` | OK — client 258.39 kB JS (gzip 78.50 kB), server dist OK |
| `npm run hygiene` | OK — no secrets or forbidden paths |
| `npm run test:e2e` (Playwright Chromium, real browser) | **30/30 passed** (36.6s) — full lesson flow + 25 viewport snapshots at 320/375/768/1024/1440 |
| Production smoke (`NODE_ENV=production node server/dist/index.js`) | `/`, `/lessons`, `/lessons/greetings-1`, `/alphabet`, `/progress` → 200; `/api/health` → 200 `{"ok":true}`; `/api/unknown` → 404; SPA deep link serves `index.html`; favicon 200 |

Note: an earlier smoke attempt appeared to show 404s on `/` — root cause
was port 3001 being occupied by a **development** `tsx watch` server the
user already had running (dev mode does not serve `client/dist`), not an
application defect. Re-tested on a free port in production mode: all PASS.

## Node version coverage

- Node 26.7.0 (this machine): full gate PASS (above).
- Node 20 / 22: covered by the new GitHub Actions matrix
  (`.github/workflows/ci.yml`). Badge/link only after a real green run
  post-push.

## Secret audit

- `npm run hygiene` PASS (tracked files + working tree + untracked).
- `git log -p` spot review of the five unpushed commits: only doc/source
  changes; no `.env`, no key material, no personal paths, no
  OmniLangTutor source. The `.env` file exists locally and is git-ignored
  (verified it is untracked and matches `.gitignore`).
- `.env.example`, `devpost/learner-profile.md` handling verified:
  `.env.example` tracked (placeholders only); `learner-profile.md`
  git-ignored and untracked.

## Provider naming corrections applied in this pass

The code and docs previously defaulted to the AMD Radeon Cloud endpoint
(`developer.amd.com.cn`, model `DeepSeek-V4-Flash`) while the verified
live credential is a **Nebius** Token Factory key. These are different
providers. Corrections (commit follows this document):

- `server/lib/tokenfactory.ts` — default `TOKENFACTORY_BASE_URL` →
  `https://api.tokenfactory.nebius.com/v1`; default model →
  `Qwen/Qwen3-235B-A22B-Instruct-2507`.
- `scripts/live-tokenfactory-smoke.ts` — same defaults; header comment
  now states the two providers are distinct.
- `.env.example` — provider section rewritten: explicit "two different
  providers" warning, Nebius listed first as the verified/default.
- `README.md` — intro and provider section corrected; AMD endpoint marked
  **Not live-tested**; references updated.
- `devpost/spec.md` — provider section rewritten (Nebius default, AMD as
  separate untested provider); stale "model list not retrieved" notes
  marked resolved with live-smoke evidence.
- `devpost/checklist.md` — spec cross-reference updated.

Post-change gate re-run on the modified repo: `npm test` 58/58 PASS,
`npm run check` PASS, `npm run build` PASS, `npm run hygiene` PASS.

## CI

`.github/workflows/ci.yml` added: Node 20 + 22 matrix (install, validators,
tsc, Vitest, production build, hygiene, production smoke) plus a Playwright
Chromium E2E job. Status badge intentionally NOT added to README until a
real green run exists on the public repo.
