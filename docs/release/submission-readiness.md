# Submission readiness — Build With AI: Basics (deadline 2026-10-26 17:00 EDT)

Machine-readable companion: `submission-gates.json` (same data, per-gate owner/remediation).

## Eligibility-blocking gates

| Gate | Status | Evidence |
|------|--------|----------|
| New app built in window (Sept 22–Oct 26) | PASS | git history from `bdacc07` onward, Oct 2026 |
| Devpost Learn Skill Pack used; scope/prd/spec approved + public | PASS | `devpost/*.md`, `status: approved` |
| Working end-to-end POC | PASS | 67 vitest + 35 Playwright (real Chromium) + prod smoke + Docker |
| Public repo with source + license | **BLOCKED until push** | push authorized; see below |
| Demo video <3:00, public | **PARTICIPANT** | not recorded; shot list `devpost/demo-script.md` |
| Devpost fields + Skill Pack explanation + age checkbox + Try-it-out URL + submit | **PARTICIPANT** | learner-authored per 6-ship |
| Free unrestricted testing through Oct 30 | PASS | public repo + local install instructions; no paywall |

## Engineering gates (all PASS unless noted)

- Clean install, validators, tsc, 67/67 unit+integration, 35/35 real-browser e2e, axe-core WCAG 2.2 A/AA zero violations, production build + smoke (node and Docker), hygiene/secret scan, 0 dependency vulnerabilities, live Nebius inference re-verified, AMD correctly NOT claimed.
- CI: workflow committed (Node 22+24 + Playwright); first green run expected after push — badge only after that.

## NOT VERIFIED (labeled, not blocking eligibility)

- Human MSA review of the 7 curated sentences.
- External novice usability session.
- Public HTTPS deployment (optional by the rules).
- AMD Radeon Cloud provider (different provider; 401 with Nebius key documented).

## Exact remaining participant actions

1. Pull latest `main` after this push lands; optionally update local `.env` to the new defaults (`TOKENFACTORY_BASE_URL=https://api.tokenfactory.nebius.com/v1`, `TOKENFACTORY_MODEL=Qwen/Qwen3-235B-A22B-Instruct-2507`) or delete those two lines — code defaults now match the verified path.
2. Record the demo video per `devpost/demo-script.md` (<3:00): no-key fallback first, then with key for the AI path. Upload public to YouTube/Vimeo.
3. Write the Devpost fields in your own words (project name, description, what-you-learned / Skill Pack explanation). I can spell/grammar-check your draft.
4. Paste `https://github.com/RafalW3bCraft/sofer` into "Try it out".
5. Check the age-of-majority box; submit before 2026-10-26 17:00 EDT.
6. (Optional) Deploy publicly with the provided Dockerfile on a Node host of your choice; set `TOKENFACTORY_API_KEY` as a platform secret.
