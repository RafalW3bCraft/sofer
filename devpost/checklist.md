---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast (verification mandatory; learner checkpoints at the early-feedback and final-review moments; awaits learner confirmation per 5-build rule)

## Slices

- [ ] **1. Runnable kernel — landing + first sentence + one tappable token + curated explanation**
  Becomes usable: A `git clone` + `npm install` + `npm run dev` flow renders the landing page, the first lesson (greeting), one Arabic sentence with full diacritics, an English translation, and a tappable token that opens an inline panel with the curated meaning + grammar note. No persistence, no quiz, no AI.
  Why now: This is the entire kernel of sofer. Proving the unique value ("tap a token, see a real explanation on a real sentence") on the first commit means every later slice has a working app to extend, and any framework/setup risk surfaces before content is written.
  PRD ref: `prd.md > The Core Journey` (steps 1–3), `prd.md > Screens and Layout` (Home + Lesson Player), `prd.md > Features and Behavior > Lesson content` and `> Token inspection`
  Spec ref: `spec.md > Components` (Home, Header, LessonPlayer, SentenceArea, TokenPanel), `spec.md > File Structure`, `spec.md > Stack`
  Build: Scaffold the repo per the spec file structure. Create `package.json` with `client/`, `server/`, `shared/`, `tests/`, `scripts/` workspaces (single root `package.json` with workspace-ish structure for the POC; Vite root in `client/`, Express entry in `server/index.ts`). Add `client/` Vite + React + TS + React Router app, single lesson JSON with one greeting sentence + 3–4 tokens, `SentenceArea` component rendering the Arabic with `<span role="button" tabindex="0">` token targets, `TokenPanel` opened by lifted state. CSS variables for the palette, no Tailwind. `npm run dev` boots Vite at :5173 and serves the lesson.
  Verify (mechanical): `npm install` exits 0; `npm run dev` starts without error; browser at http://localhost:5173 renders Home; clicking Start Learning routes to `/lessons/greetings-1`; the greeting sentence renders RTL with the English translation below; clicking a token opens a panel showing that token's meaning + grammar note. Run `tsc --noEmit` clean. Vitest unit test for token-span offsets passes.
  Learner check: `cd /home/sp3ct0r/sofer-hackathon && npm install && npm run dev`, open `http://localhost:5173`, click Start Learning, read the greeting, click one Arabic word, and confirm the explanation panel matches what the curated data says.
  Commit: `Slice 1: runnable kernel — landing, one lesson, tappable token`

- [ ] **2. Full lesson content + comprehension loop + persisted progress**
  Becomes usable: **Seven** curated MSA sentences across **3 topical lessons** (greetings + numbers + directions, 2–3 sentences each), one 4-option MCQ each with curated correct/incorrect explanations, lesson list with completion checks, deterministic grading, Next/Back navigation, `sofer.progress.v1` localStorage with safe recovery, reload preserves completion, Reset clears it. **Interactive behaviors wired in:** keyboard navigation across tokens (Tab/Shift+Tab, Arrow Left/Right, Enter/Space, Escape), focus + hover preview of token meaning, "Mark as tricky" toggle writing to `sofer.tokens.v1`, and a transliteration reveal toggle on the lesson player.
  Why now: Content + grading + persistence together — these are the inseparable loop that the demo must show end to end. Adds the rest of the user-facing surfaces (Lesson List, Progress).
  PRD ref: `prd.md > The Core Journey` (steps 4–6, 8), `prd.md > Features and Behavior > Lesson content`, `> Comprehension check`, `> Progress tracking`, `prd.md > States and Boundaries` (Corrupted localStorage, Empty state on Progress)
  Spec ref: `spec.md > Components` (LessonList, ProgressPanel, ProgressPanel + grading), `spec.md > Data Model` (Lesson + ProgressV1), `spec.md > Components > LessonPlayer` (QuestionArea + NavigationFooter)
  Build: Author 5 sentences in `client/src/content/lessons.json` (3 greetings + 1 numbers + 1 directions) with full diacritics, English translations, transliterations, ordered tokens with start/end offsets, 4-option questions with correctIndex + correctExplanation + 3 incorrectExplanations. Add `scripts/validate-lessons.ts` (Zod) to verify offsets, uniqueness, question counts. Wire QuestionArea + deterministic grader + feedback reveal. Implement `lib/storage.ts` with versioned localStorage + safe-recovery + reset. Lesson List reads `lessons.json` + storage and renders checks. Progress screen derives totals from storage. Wire Next/Back navigation. Unit tests for grading, storage recovery, lesson schema validation.
  Verify (mechanical): `npm run validate:lessons` exits 0. Vitest unit tests pass for grading, storage happy path + corrupted-recovery + unsupported-version paths, lesson-schema test (28 letters? no, sentence count = 5; offsets all valid; correct index 0–3; unique IDs). Manual: complete a lesson, refresh, see completion; complete another, see total count + accuracy; click Reset, see cleared state + inline notice (when forced into a corrupt state). Reload between lessons does not double-count questions.
  Learner check: Walk the full 5-sentence loop. Read each sentence, tap at least one token in each, answer the question (try one wrong on purpose), confirm feedback teaches, advance to next lesson, open Progress, reload the tab, confirm progress persists, hit Reset.
  Commit: `Slice 2: five lessons, comprehension loop, persisted progress`

- [ ] **3. Alphabet intro + accessibility + speech synthesis + RTL polish**
  Becomes usable: `/alphabet` page with all 28 letters (isolated form, name, transliteration, optional Listen), a short diacritics intro section, persistent header with mobile menu disclosure, full keyboard nav, visible focus rings against the warm-neutral palette, reduced-motion respected, browser speech synthesis for "Listen" buttons with honest "no Arabic voice" fallback when no `lang="ar"` voice is enumerated, mobile and desktop viewports both usable.
  Why now: The alphabet page is the second main experience in scope. Accessibility, RTL isolation, and speech fallback are the polish layer that determines whether the demo reads as "professional" or as "first React app." Better to land these together so the polish isn't a separate marathon at the end.
  PRD ref: `prd.md > Screens and Layout` (Alphabet intro, Header), `prd.md > Features and Behavior > Browser speech synthesis`, `prd.md > Look and Feel`, `prd.md > States and Boundaries` (Arabic voice unavailable, Reduced motion, Keyboard only)
  Spec ref: `spec.md > Components` (AlphabetGrid, Header), `spec.md > Look and Feel`, `spec.md > Data Model` (Alphabet data), `spec.md > Important Failure Modes` (No Arabic voice available, Browser does not support speechSynthesis)
  Build: Author `client/src/content/alphabet.json` with exactly 28 letters (id, name, isolated, transliteration, diacritics hint). Build AlphabetGrid component + the short diacritics intro. Implement `lib/speech.ts` — enumerates voices, picks first `lang` starting with `ar`, exposes `speakArabic(text)`, returns a status the UI uses to hide/disable Listen buttons. Wire mobile header disclosure with `<details>`/`<summary>` (no JS, keyboard-friendly). Add focus-visible CSS, `prefers-reduced-motion` media query, semantic buttons throughout. Validate alphabet.json count = 28, unique IDs, every name present.
  Verify (mechanical): `npm run validate:alphabet` exits 0 (28 letters, unique IDs). Playwright or manual screenshot at mobile (375px) and desktop (1280px) — no horizontal overflow, Arabic glyphs render with diacritics visible. Browser devtools: tab through Home → Lesson List → Lesson Player → Alphabet → Progress, focus visible at every stop. DevTools "Emulate CSS media feature prefers-reduced-motion: reduce" — focus transitions disabled. `window.speechSynthesis.getVoices()` check — Listen buttons hide correctly when no Arabic voice.
  Learner check: Open `/alphabet`, verify all 28 letters visible with names + transliteration, hit Listen on a few (with and without an Arabic voice installed), tab through the whole app from Home with the keyboard only, switch to a narrow mobile viewport and confirm the menu disclosure works.
  Commit: `Slice 3: alphabet, accessibility, speech synthesis, mobile polish`

- [ ] **4. Optional AI tutor — server endpoint + mock-tested adapter + frontend integration**
  Becomes usable: A `POST /api/ai/explain` endpoint in `server/` that validates input with Zod, calls Token Factory via a thin adapter (`server/lib/tokenfactory.ts`) when `TOKENFACTORY_API_KEY` is set, validates the response shape, and returns either `{ explanation, model, generatedAt, cached }` or a structured 503. The frontend `AiTutorButton` + `useAiExplain` hook calls the endpoint, renders the explanation as plain text in a labeled panel, and on any failure shows the curated fallback with an "AI tutor unavailable" pill. No `TOKENFACTORY_API_KEY` on this machine → live integration stays "unverified"; mock tests prove the success and failure paths.
  Why now: The AI tutor is the most uncertain piece (third-party API, network calls, schema validation). It's deferred in scope but the spec's risk-first sequencing says isolate it before the polish of release work so a missing key doesn't block the rest.
  PRD ref: `prd.md > Features and Behavior > AI tutor (optional)`, `prd.md > States and Boundaries` (AI tutor unavailable, Token Factory returns a non-schema response)
  Spec ref: `spec.md > Components > Server endpoint POST /api/ai/explain`, `spec.md > Stack` (Backend), `spec.md > External Services and Dependencies > AMD Token Factory`, `spec.md > Important Failure Modes` (No key, key but unreachable, schema mismatch)
  Build: Implement `shared/schemas.ts` (Zod for ExplainRequest + ExplainResponse + ExplainError). Implement `server/lib/tokenfactory.ts` with `explain({...})` returning `Result<ExplainResponse, ExplainError>`; uses `fetch` to `POST {TOKENFACTORY_BASE_URL}/chat/completions` with `Authorization: Bearer ${TOKENFACTORY_API_KEY}`, abortable via `AbortController` with `TOKENFACTORY_TIMEOUT_MS`, validates response with Zod. Implement `server/routes/explain.ts` with rate limit (30 req/min/IP, in-memory sliding window) + 8 KB body cap + concurrency 4. Express bootstrap in `server/index.ts` with the `/api/*` route and static `client/dist/` only when `NODE_ENV=production`. Vite dev proxy `/api/*` → `http://localhost:3001` in `client/vite.config.ts`. Frontend `lib/ai.ts` (`useAiExplain` hook) + `AiTutorButton` component. `tests/integration/explain-route.test.ts` with an in-process mock Token Factory (success, 401, 429, 5xx, timeout, malformed JSON, schema mismatch, oversized request). README updated with how to start the server and what `npm run dev` vs `npm start` mean. `.env.example` with TOKENFACTORY_API_KEY/BASE_URL/MODEL/TIMEOUT_MS placeholders.
  Verify (mechanical): `npm run build` (client + server) exits 0. Vitest integration tests pass for all listed cases (success, missing key, timeout, 401, 429, 5xx, malformed JSON, schema mismatch, oversized request). `npm run start` boots the unified server at :3001 with the built client. `curl -X POST http://localhost:3001/api/ai/explain -H 'Content-Type: application/json' -d '{}'` returns 400 with structured error. `curl` with the mock-server pointed to via `TOKENFACTORY_BASE_URL=http://localhost:NNNN/api/v1` returns 200 `{ explanation: "..." }`. Confirm no `TOKENFACTORY_API_KEY` ships in the client bundle (`grep -r TOKENFACTORY_API_KEY client/dist/` must return nothing). Rate-limit test: 31st request in a minute returns 429.
  Learner check: With no key set, click "Explain with AI tutor" on a token — confirm the curated fallback renders with the "AI tutor unavailable" pill. If you have a real `TOKENFACTORY_API_KEY` and want to verify live: drop it in `.env`, restart `npm run dev`, click again, confirm a real schema-validated explanation renders labeled "Generated by AI · Model X."
  Commit: `Slice 4: AI tutor endpoint + mock-tested Token Factory adapter`

- [ ] **5. Release quality — clean reinstall, production build, tests, README, LICENSE, .env.example, app map, demo script**
  Becomes usable: A clean clone on a fresh machine — `npm install && npm run dev` boots the full app, `npm run build && npm start` serves the production build, `npm test` passes the unit + integration suite, `npm run test:e2e` runs the Playwright browser flow once Chromium is installed. README is honest about what works locally, what's optional, what credentials are needed. LICENSE is present. `.env.example` contains only variable names. `devpost/checklist.md` Final Review and Code Tour + App Map sections are completed. `devpost/app-map.html` is generated. `devpost/demo-script.md` is drafted. Repo hygiene audit passes: no secrets in tracked files, `OmniLangTutor/` not tracked, no `node_modules`/`dist` in tree, `learner-profile.md` gitignored.
  Why now: This is what a Devpost reviewer sees on first inspection. Without this slice the build isn't submittable.
  PRD ref: `devpost/prd.md > What We're Building`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`
  Build: Add MIT LICENSE. Author a root README.md that documents install/start/test commands, the two run modes (dev with Vite proxy vs production unified server), what TOKENFACTORY_API_KEY does, the local-only default, and a copy-pasteable `.env.example`. Add `npm run test:e2e` Playwright config + one full-lesson E2E (`tests/e2e/lesson-flow.spec.ts`). Add an `npm run hygiene` script that scans tracked files for `NEBIUS_API_KEY` / `OPENAI_API_KEY` / `sk-` / `ghp_` patterns and exits non-zero on any hit. Run `npm audit --omit=dev` and document high/critical findings (if any) in README. Generate `devpost/app-map.html` from the final file structure. Author `devpost/demo-script.md` with a 150–165 second shot list covering the core journey. Run a final hygiene pass: `git ls-files | xargs grep -lE 'NEBIUS_API_KEY|NEBIUS_BASE_URL'` must return empty.
  Verify (mechanical): From a clean clone: `rm -rf node_modules && npm ci && npm run check && npm test && npm run build && npm start &` boots and serves at :3001. `npm run hygiene` exits 0. `npm run test:e2e` (after `npx playwright install chromium`) passes the lesson flow. `git status` clean except for the intended additions.
  Learner check: Walk the README on a clean checkout. Confirm the demo script matches what you'd record.
  Commit: `Slice 5: release quality — README, LICENSE, .env.example, tests, app map, demo script`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — at end of Slice 1 (kernel up: home → first sentence → tap a token)
- [ ] Final kick-the-tires exploration and feedback completed — at end of Slice 5

## Final Review

<!-- Add agreed revision tasks as unchecked boxes here. Track findings and verification briefly. -->

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [filled in during the build]
Route and stops: [filled in during the build]
Edit outcome: [filled in during the build]
Reflection: [filled in during the build]
Activity mode: [filled in during the build]

## Revisions

<!-- Append a bullet here whenever implementation contradicts the plan: "- [What changed] — [what the build discovered]." -->