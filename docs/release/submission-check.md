# Devpost Submission Check

Re-verified at: 2026-10-23 (commit 13fe742); updated 2026-10-23 ~06:00 UTC after commits `c4c2201`, `7dc424c`, `305a8d2` (provider defaults, CI, UX hint, security headers, self-hosted font). Live Nebius inference re-verified PASS same day (`docs/release/live-smoke.md` addendum). All gates re-run green: 58/58 Vitest, 30/30 Playwright (real Chromium on the owner machine), tsc, validators, build, hygiene, production smoke with strict CSP. **GitHub Actions CI added (`.github/workflows/ci.yml`) but its first real run happens only after the participant authorizes the push — badge/link withheld until then.**

| Devpost rule | Status | Evidence |
|--------------|--------|----------|
| Newly built project | PASS | `git log` shows `bdacc07 feat: scaffold sofer — Arabic tutor with tappable tokens, 7-sentence curriculum, optional AI tutor` plus the current `13fe742 fix: ...` commit. The repo is brand-new for this hackathon. |
| Genuine use of Devpost Learn Skill Pack from inception | PASS | `devpost/scope.md`, `devpost/prd.md`, `devpost/spec.md`, `devpost/checklist.md` are present and substantive. Skill files (`agent/skills/1-start` through `6-ship`, `.agents/skills/...`) are tracked in the repo and used during planning. |
| Coherent scope, prd, spec docs in public repo | PASS | `devpost/scope.md` (82 lines, `status: approved`), `devpost/prd.md` (145 lines, `status: approved`), `devpost/spec.md` (369 lines, `status: approved`). |
| Real useful end-to-end POC | PASS | `docs/release/feature-matrix.md` + `docs/release/baseline-audit.md`. Verified Playwright 5/5 + Vitest 52/52 + production build + curl smoke. |
| Public repository with source | PASS | https://github.com/RafalW3bCraft/sofer |
| Working instructions | PASS | `README.md` Quick start, Production preview, Test commands. |
| Visible LICENSE | PASS | `LICENSE` present (MIT). |
| Public YouTube/Vimeo demo < 3 minutes | NOT VERIFIED | No video uploaded yet — participant-only action. `devpost/demo-script.md` drafts the shot list. |
| Demo shows working app + fallback | NOT VERIFIED | Same as above — pending participant recording. |
| Submission fields (what it does / audience / process) | NOT VERIFIED | Per directive 10: the participant writes the text; agent may only spellcheck. |
| Skill Pack usage explanation | NOT VERIFIED | Participant to author. Suggested answer is in `devpost/checklist.md > Code Tour and App Map > Activity and evidence`. |
| Age-of-majority checkbox | NOT VERIFIED | Participant action. |
| Public repository URL in Devpost "Try it out" field | NOT VERIFIED | Participant action. URL is https://github.com/RafalW3bCraft/sofer |
| Original material and third-party rights | PASS | All curated Arabic content authored for this project. UI copy is original English. AI responses from Token Factory are labeled and treated as untrusted. MIT license permits reuse. |
| English submission / translation | PASS | UI copy and planning docs are in English. |
| No unlicensed music/trademarks | PASS | No music. The wordmark "sofer" is original. |
| Submit before 2026-10-26 17:00 EDT | NOT VERIFIED | Deadline is 2026-10-26 at 17:00 EDT (UTC-4). All code, docs, and tests are ready for submission. |
| Live HTTPS deployment (optional) | NOT VERIFIED | Live AI was VERIFIED on the participant's local machine against the Nebius Token Factory endpoint (`docs/release/live-smoke.md`). No public HTTPS URL was published by the agent; that is a participant-only action and the official rules explicitly note that a live URL is OPTIONAL. |

## Outstanding participant-only actions

1. **Record and upload the demo video** (<3 min). Suggested shot list is in
   `devpost/demo-script.md`. Use a clean `.env` with no key for the first
   pass to demonstrate the fallback path, then with a key to show the AI
   explanation. Both should be captured in the same recording.
2. **Author the Devpost submission text** (per the official `6-ship`
   skill: agent may spell-check, not draft). The agent has prepared
   factual building blocks under `docs/release/`. The participant should
   write the four submission fields in their own voice.
3. **Confirm the age-of-majority checkbox** on the Devpost form.
4. **Paste the public repo URL into the Devpost "Try it out" field.**
   URL: `https://github.com/RafalW3bCraft/sofer`.
5. **(Optional) Authorize a public deployment.** The repository is
   reproducible locally and includes the production build pipeline. A
   Cloudflare Pages + Worker (or Render / Fly.io) deployment is the most
   appropriate shape; the participant must choose a host and provide
   their own credentials. See `docs/release/live-smoke.md` for the
   verified smoke output that proves the app works end-to-end against
   Token Factory.
6. **Press Submit** before 2026-10-26 17:00 EDT.

## Outstanding NOT VERIFIED items the participant can close

- Native-MSA linguistic review of the curated sentences. The structural
  validation passes (`validate:lessons`) but a proficient Modern Standard
  Arabic reader should confirm the meanings, grammar notes, and
  question distractors. The README, PRD, and feature matrix all call
  this out as a remaining unknown.
- Optional axe-core automated accessibility smoke. The structural checks
  in Playwright pass; an automated `axe-core` sweep would add a numeric
  score but is not a substitute for the existing manual audit.