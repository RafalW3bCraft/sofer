# Industry and hackathon readiness audit

**Audit date:** 2026-11-19  
**Repository:** `RafalW3bCraft/sofer`  
**Reviewed commit:** `4de0ee365740bb7b73ac095a67300e8369a9bf2b` (`main`)  
**Method:** source inspection, current official contest rules, Firebase documentation, and competitor product pages. Product positioning observations below are analysis, not market-size estimates.

## Executive summary

Sofer has a credible narrow product idea: beginner Modern Standard Arabic (MSA) sentence reading with word-level explanations, local-first progress, and an optional lesson-grounded tutor that can use Firebase hybrid inference. That is a clearer use of hybrid AI than a generic chatbot. The repo already includes meaningful implementation work: the Firebase AI Logic adapter, App Check setup, four inference modes, response validation, 12 lesson records, local practice/review, Firebase Auth/Firestore sync, documentation, and automated checks.

It is **not submission-ready yet**. The most important gaps are verifiable runtime proof (Firebase project configuration is absent; no real cloud or device inference has been recorded), only 3 trusted lessons / 7 sentences (the other 9 lessons / 41 sentences are explicitly drafts), and no hosted judge URL or final public demo. Production App Check, Firestore rules, and deployment are prepared but not verified against a real project. No human Arabic reviewer is available, so draft content must remain out of the trusted learning path.

The cleanest competitive position is “a careful MSA reading companion for understanding each word in a real sentence,” not “a complete Arabic course.” Large competitors already offer deep curricula, audio, community or video, and retention mechanics. Sofer can stand out on contextual Arabic token analysis plus honest, private-by-default hybrid help, but it needs a reliable first lesson and demonstrable local/cloud behavior to prove that distinction.

## Category and competitor scan

This is a product-feature comparison based on public product pages, not an independent usability or efficacy study.

| Product | Publicly described Arabic-learning strength | Sofer implication |
|---|---|---|
| Duolingo | Short, habit-oriented lessons and game-like practice. [Arabic course](https://www.duolingo.com/enroll/ar/en/Nauka-arabskiego) | Sofer should match ease of starting and clarity of progress, without copying streak-heavy gamification. |
| Busuu | Arabic course mapped from A1 to B2, with structured courses and community-oriented learning. [Course levels](https://help.busuu.com/hc/en-gb/articles/16519527128849-How-many-languages-can-I-learn) | A 12-lesson starter pack is a prototype-sized foundation, not a comparable full curriculum. A reviewed scope and proficiency outcomes matter. |
| Mango Languages | Separate MSA and dialect offerings; its MSA course highlights pronunciation, memory exercises, culture notes and substantial structured content. [MSA course](https://www.mangolanguages.com/available-languages/modern-standard-arabic-msa) · [Course catalog](https://www.mangolanguages.com/available-languages) | Sofer must label MSA plainly, give learners useful audio, and avoid implying that MSA substitutes for Egyptian/Levantine/Iraqi conversational courses. |
| Memrise | Current Arabic page promotes levelled native-speaker video, vocabulary, and AI speaking practice. [Arabic learning page](https://www.memrise.com/en-us/learn-arabic) | Contextual AI is not unique by itself. Sofer's proof point must be grounded explanations tied to the exact Arabic sentence and actual local/cloud inference reporting. |
| LingQ | Extensive Arabic reading/listening catalog, contextual vocabulary and spaced repetition. [Arabic product](https://www.lingq.com/en/learn-arabic-online/) | Reading plus vocabulary review is established. Sofer needs a stronger differentiator: beginner-safe token/grammar explanations and trusted MSA content. |

### Product differentiation and limits

- **Potential advantage:** combining diacritized beginner sentences, tappable token-level glosses, concise grammar notes, and a tutor constrained to reviewed lesson context.
- **Potential advantage:** guest/local-first use and a genuine on-device inference option can make the experience useful with limited connectivity and reduce unnecessary data transfer, if tested on supported hardware.
- **Current weakness:** only seven trusted sentences are enough to show the concept but not to substantiate an A1 learning journey. Drafts cannot be treated as reviewed educational content.
- **Current weakness:** browser speech synthesis is not native-speaker pronunciation evidence. There is no verified pronunciation assessment, listening curriculum, or conversational speaking practice.
- **Current weakness:** no public usability evidence, learner outcomes, or independent Arabic review. Do not make efficacy claims.
- **Recommendation:** narrow the release promise to “guided beginner MSA reading”; prioritize reviewed lesson quality, one polished complete learning loop, and live inference evidence over adding more unreviewed lessons.

## Official contest requirements cross-check

The rules page was checked on 2026-11-19. The current listed deadline is **November 30, 2026 at 2:00 PM Pacific Time** (5:00 PM Eastern Standard Time). [Official Devpost rules](https://firebasehybridaihackathon.devpost.com/rules)

| Rule / evaluation item | Repository evidence | Status / next action |
|---|---|---|
| Build a GenAI app using Firebase AI Logic; choose at least one supported platform. Web platform is specifically Chrome with Gemini Nano 4 through Firebase AI Logic. | `client/src/lib/ai/firebaseProvider.ts` imports `firebase/ai`, builds a Google backend, configures cloud model and SDK inference mode; service consumes `response.inferenceSource`. | **Code present; live behavior unverified.** Provide Firebase config, enable AI Logic, run cloud and supported Chrome desktop checks, capture source evidence. Verify current Firebase web guide and model requirements before demo. |
| Firebase AI Logic requires App Check; debug tokens are accepted by the rules for submissions. | `client/src/lib/firebase/config.ts` configures reCAPTCHA Enterprise; development debug flag is available. | **Code present; project setup missing.** Register app and provider, register a local debug token, verify AI Logic App Check enforcement; use reCAPTCHA Enterprise for production. Never publish a debug token. |
| Project must run consistently as depicted and be available to judges for testing. Hosted URL is encouraged. | Local guest app runs; `firebase.json` prepares Hosting and a Cloud Run dictionary rewrite. | **Local guest path verified; public judge path absent.** Project owner must configure the Firebase project and authorize a deployment before publication. |
| Existing work must be significantly updated during the submission period; disclose incorporated prior work and summarize work done during the period. | Baseline/disclosure docs record the pre-period repository and changes. Git history begins 2026-10-22; period begins 2026-11-11. | **Disclosure drafted.** Confirm all dates/contributions against Git and the owner’s facts; submission form must explain the old app’s value and what was built Nov 11 onward. |
| Submission includes a description explaining Firebase AI Logic use, functionality, and value proposition. | README and architecture/setup docs describe the runtime path. | **Draft available; Devpost text still needs final edit** after live inference behavior is known. |
| Public GitHub/GitLab repo, open-source license, complete source and instructions; code must import and actually call Firebase AI Logic at runtime. | Git remote is public project URL; MIT `LICENSE`; implementation imports and calls SDK functions. | **Source criterion appears met.** Confirm GitHub visibility and About/license detection at submission time; do not rely on README mention alone. |
| Public YouTube demo, maximum three minutes, English or English subtitles; show functioning app. | `docs/hybrid-2026/DEMO_SCRIPT.md` is a draft. | **Not met yet.** Record only after cloud/device results; publish YouTube video and add final URL. |
| App and submission materials support English; provide judge access without charge/restrictions; never include production API keys, project secrets or PII. | UI and docs are English; `.env` is ignored; `hygiene` script exists. | **Partially met.** Keep real Firebase web identifiers in ignored local env only, never service-account secrets or debug token; perform final secret scan; test public access with a clean browser. |
| Judging: equally weighted technological implementation, design, impact, idea quality. | Strong architectural intent and product docs. | **Evidence gaps:** real hybrid run, complete coherent beginner experience, specific learner problem proof, and why hybrid local/cloud is materially useful. Demo each criterion. |
| Eligibility: age of majority, excluded-country/sanctions constraints, internet access as of Nov 11; entrant/team records and permissions. | Not knowable from repository. | **Owner confirmation required** in the Devpost account; verify team membership/representation and use rights. |

The contest rules identify Chrome web local inference with Gemini Nano 4; the app's source labels the device endpoint as Chrome Prompt API and relies on Firebase SDK `PREFER_ON_DEVICE`. Confirm the currently supported Firebase SDK/browser contract and model naming on the actual supported Chrome build rather than treating a selected mode as proof. Firebase's API docs say a request made before device-model readiness can cloud-fallback under `PREFER_ON_DEVICE`; therefore record the actual returned inference source. [Firebase hybrid web guide](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started) · [GenerativeModel API](https://firebase.google.com/docs/reference/js/ai.generativemodel)

## Code and product gap register

### P0 — before calling it submission-ready

1. **Firebase project integration and evidence:** `.env` contains only legacy server variable names, not Firebase web config. No real cloud or on-device request has been tested. Follow `FIREBASE_SETUP.md`, run actual requests, and update `EVIDENCE.md` with browser/version, model availability, request type, observed source, and result. Keep mocks marked as mocks.
2. **Review quality and honest scope:** trusted count remains 3 lessons / 7 sentences. Arrange a qualified MSA reviewer for the 41 draft sentences or keep them clearly unavailable/preview-only; do not silently promote them.
3. **Judge access:** no deployment URL or YouTube URL exists. Configure App Check, deploy Hosting/API after explicit owner approval, test on a clean browser, then record public URLs.
4. **Readiness communications:** final Devpost description must say which existing app work predates Nov 11 and give a concrete period-of-submission work summary. Owner confirms eligibility, team, original-work rights, and account access.

### P1 — improve judging quality

- Evaluate Arabic local-model outputs on diacritics, prefixes, contextual meaning, and short grammar questions; collect examples and label limitations. On-device language compatibility has not been demonstrated.
- Add a short onboarding objective and explain that the course is MSA, not a dialect course; make the quality and provenance of each lesson visible.
- Improve the learner loop with reviewed comprehension and listening/pronunciation content. Current browser TTS varies by installed voice and is not verified native audio.
- Do a live browser/CSP and mobile accessibility pass. Existing automated responsive/axe E2E evidence is valuable but does not replace real Firebase browser interaction.
- Remove the obsolete Token Factory values from the ignored local `.env` and revoke/rotate its old API key if it remains active. Do not share that key in logs or tickets.

### P2 — post-submission scope

- Expand toward 12 reviewed lessons and a defensible A1 sequence; add dialect guidance and more listening/speaking only with validated content and audio rights.
- Consider educator review workflows, richer progress and sync conflict testing after the submission's core path is proven.
- Do not add social features, paid analytics, a vector database, or unsupported efficacy claims for this deadline.

## Cleanup inventory and disposition

| Candidate | Why it looks stale | Recommendation / risk |
|---|---|---|
| `TOKENFACTORY_*` entries in `.env.example` and local ignored `.env` | Active tutor has moved to Firebase; server no longer mounts Token Factory endpoint. | Example placeholders removed. Local ignored `.env` was left untouched and not read out; inspect/remove/rotate its legacy provider key deliberately. |
| `server/lib/tokenfactory.ts`, `server/routes/explain.ts`, `tests/unit/provider-allowlist.test.ts`, `tests/integration/{explain-route.test.ts,mock-tokenfactory.ts}`, `scripts/live-tokenfactory-smoke.ts`, root `smoke:live` script | Retired Token Factory path; no longer mounted by `server/index.ts`, with only isolated tests using it. | Removed from active source. Git history retains the pre-existing implementation; dictionary route remains. Confirm no external deployment separately imports retired files. |
| `server/lib/auth.ts`, `server/routes/me.ts`, `better-auth` dependency | Better Auth was not mounted; Firebase Auth is the active client account path. | Removed inactive implementation/dependency. Existing SQL migration/schema history and local database are retained; no tables or records were dropped. |
| `client/dist/`, `server/dist/`, `node_modules/`, `test-results/` | Ignored local build/dependency/test artifacts. | Not tracked and not deleted. Keep dependencies while the local app is running. |
| `devpost/prd.md`, `spec.md`, `scope.md`, `checklist.md`, `app-map.html`, `demo-script.md` | Earlier project-planning artifacts may contain obsolete Token Factory language. | Retain as provenance for pre-existing work; reconcile stale content and link the current plan rather than delete evidence of the prior project. |

## Iterative execution plan and gates

1. **Make the app inspectable now:** local guest app is launched at `http://127.0.0.1:5173/`; health endpoint is `http://127.0.0.1:3001/api/health`. Firebase AI currently stays unavailable because this checkout has no Firebase web configuration.
2. **Verify cleanup:** run the existing test/type/build/hygiene gates after the targeted stale-path removal; preserve dictionary, SQL history, content provenance and ignored user secrets.
3. **Configure Firebase with the owner:** use existing/new project, register Web app, enable Firebase AI Logic and supported provider/model, configure App Check and debug token for local testing, optionally enable Auth, deploy Firestore rules to emulator first, and verify ownership behavior.
4. **Demonstrate the acceptance gate:** Cloud inference from a configured browser; Chrome desktop supported device model after a user gesture; show actual `inferenceSource`; run Arabic examples and offline/failure fallbacks; record evidence separately from tests using doubles.
5. **Release content gate:** receive Arabic review for candidate lessons or constrain public lesson access to the original trusted pack; confirm all public learner-facing content and grading data.
6. **Security/release gate:** audit runtime and dependencies, secret scan, CSP in actual browser, emulator rules, clean install/build/E2E, App Check enforcement, production hosting test, judge URL.
7. **Submission gate:** verify public repository/license, existing-work disclosure, Devpost platform selection, eligibility/team status, concise English description, public ≤3 minute YouTube video, judge testing instructions, and submission before Nov 30 2:00 PM PT.

### Owner setup steps for Firebase access

1. Provide the Firebase project ID and create/register a Firebase **Web app** in that project; share only the public Web app config values needed for local `.env` (`apiKey`, `authDomain`, `projectId`, `appId`, optional messaging/storage IDs). Never send a service-account JSON key.
2. In Firebase Console, enable Firebase AI Logic and select a supported provider/model for this project. Confirm project billing/quota/region availability for `gemini-3.5-flash-lite` cloud fallback before the live check.
3. Register App Check for the web app. For local development create/register a debug token and set the local-only debug flag. For production register reCAPTCHA Enterprise and enforce App Check for AI Logic.
4. If sign-in/sync is wanted, enable Email/Password Auth. Start Auth and Firestore emulators; test `firestore.rules` ownership rules before deployment.
5. Supply these values through the ignored root `.env` (not chat, Git, docs or screenshots). I can then run the real integration checks. Review and authorize deploy/publish separately; no deployment has been performed.
6. For device inference, use a supported desktop Chrome release and hardware with Prompt API/Gemini Nano availability. Model download may require time/network/storage; capture browser/version and actual returned inference source.

## Sources

- [#BuildHybridAI 2026 official rules](https://firebasehybridaihackathon.devpost.com/rules), checked 2026-11-19.
- [Firebase AI Logic hybrid web guide](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started), [configuration modes](https://firebase.google.com/docs/ai-logic/hybrid/web/configuration-options), [production checklist](https://firebase.google.com/docs/ai-logic/production-checklist), and [App Check](https://firebase.google.com/docs/ai-logic/app-check), checked 2026-11-19.
- Competitor public pages linked in the category table, checked 2026-11-19. Statements describe vendors' own product positioning and should not be read as independent efficacy evidence.
