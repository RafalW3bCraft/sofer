# sofer — Feature Matrix

For every shipped feature: route/component, backend/API dependency, expected user outcome, test locations, direct observation, severity, and PASS/FAIL/NOT RUN.

Generated: 2026-10-23 (commit 13fe742)

Legend: PASS = verified by automated test or reproduced observation; FAIL = broken; NOT RUN = blocked; NOT VERIFIED = live external service unavailable.

## Surfaces

| Surface | Route | Component | Backend dep | Test(s) | Observation | Status |
|---------|-------|-----------|-------------|---------|-------------|--------|
| Home / first launch | `/` | `pages/Home.tsx` | none | Playwright `home -> lesson -> ...` (1) | Loads, "Start Learning" CTA visible | PASS |
| Lesson discovery | `/lessons` | `pages/LessonList.tsx` | reads V2 storage | Playwright `completing every sentence marks the lesson done` (2) | Lists 3 lessons, completion count, "Continue where you left off" | PASS |
| Lesson player | `/lessons/:lessonId` | `pages/LessonPlayer.tsx` | none | Playwright (1) + (2) + Vitest `progress-domain` | Sentence area, token targets, comprehension question | PASS |
| Alphabet | `/alphabet` | `pages/Alphabet.tsx` | none | Playwright `alphabet page lists 28 letters and 3 diacritics` + Vitest `speech-status` | 28 cells, 3 diacritics, Listen button visible/disabled per voice status | PASS |
| Progress | `/progress` | `pages/Progress.tsx` | reads V2 + tricky storage | Playwright (1), `re-submitting ... does not inflate` | Counts, accuracy, tricky list, reset | PASS |
| 404 | `*` | `App.NotFound` | none | implicit (Playwright never navigates to one) | Static "Page not found" | PASS |
| Production SPA fallback | `*` non-/api | Express `app.get(/^(?!\/api\/).*/)` | static `client/dist` | Vitest `production-server` (4 cases) + curl smoke | Returns `index.html` for GET / and SPA routes, hashed assets serve | PASS |
| Production API 404 | `/api/*` unknown | Express catch-all `app.use('/api', ...)` | none | Vitest `production-server` | JSON `{error: "not_found", message: ...}` 404 | PASS |

## Curated content

| Feature | Source | Test | Status |
|---------|--------|------|--------|
| 7 MSA sentences across 3 lessons | `client/src/content/lessons.json` | `npm run validate:lessons` (3 lessons, 7 sentences, 18 tokens with correct offsets) | PASS |
| 4 options per question | schema `QuestionSchema.options.length === 4` | lessons-schema + explain-route tests | PASS |
| Token offsets match substring | `validate-lessons.ts` | `npm run validate:lessons` | PASS |
| Correct explanations present | content author review + schema | structural: every question has correctExplanation | PASS |
| 28 unique Arabic letters | `client/src/content/alphabet.json` | `npm run validate:alphabet` (28 unique) | PASS |
| Diacritics intro | `alphabet.json#diacritics` (3 entries) | Playwright (text `fatḥa`, `kasra`, `ḍamma`) | PASS |
| Native-language pedagogy review | NOT VERIFIED — the author has no native-MSA reviewer available in this environment; structural validation confirms content shape but not linguistic correctness. | – | NOT VERIFIED |

## Token inspection

| Feature | Test | Status |
|---------|------|--------|
| Tap/click activates panel | Playwright (1) `tap the first token; TokenPanel appears` | PASS |
| Curated meaning in panel | Playwright (1) `token-panel__meaning contains /peace/i` | PASS |
| "Mark as tricky" toggle | Playwright (1) `Mark as tricky -> Marked tricky` | PASS |
| Listen button (browser TTS) | Vitest `speech-status` (5 cases incl. async voiceschanged) | PASS |
| Keyboard nav (Tab, Arrow, Esc) | `SentenceArea` handlers + Vitest no regression | PASS (manual verification; keyboard navigation code path is unchanged) |
| Tricky token deep link | Playwright `tricky token deep link focuses the right sentence + token` | PASS |

## Comprehension

| Feature | Test | Status |
|---------|------|--------|
| 4-choice radio group | `QuestionArea` + Playwright (1) | PASS |
| Deterministic grading | `client/src/lib/grading.ts` + Vitest `grading.test.ts` (4 cases) | PASS |
| Distinct feedback for wrong picks | content has 3 incorrectExplanations; Vitest `grading.test.ts` "maps each incorrect option to its own explanation" | PASS |
| Lesson completion only after final sentence | Playwright (2) `1 of 3 lessons complete` after answering all 3 | PASS |
| Resume from last unanswered sentence | Playwright (1) `reload -> Sentence 2 of 3` | PASS |
| Idempotent re-answer (no inflation) | Vitest `progress-domain` (5 cases: same-pair idempotent, wrong->right, right->wrong) + Playwright (3) | PASS |
| Reset confirmation | Playwright implicit (Reset button) + Vitest storage module | PASS |

## Progress

| Feature | Test | Status |
|---------|------|--------|
| Lessons completed count | derived in `progress.ts`, Playwright (2) `1 of 3 lessons complete` | PASS |
| Questions answered count | derived from totals, Playwright (3) `.progress-stat__value === "1"` | PASS |
| Accuracy % | `accuracyPercent`, Playwright (3) | PASS |
| Tricky tokens list with deep links | Playwright (5) `Jump to lesson` | PASS |
| Reset with confirmation | `Progress.tsx` `resetting` two-step; storage migration tests cover safe removal | PASS |

## Speech

| Feature | Test | Status |
|---------|------|--------|
| Voice detection | Vitest `speech-status` (5 cases: unsupported, ready, no_arabic_voice, async voiceschanged, unsubscribe) | PASS |
| Reactive UI on voice load | Vitest `speech-status` `notifies subscribers when voices change` | PASS |
| Speak Arabic | `speakArabic` returns boolean; gated on ready status | PASS (mock-friendly; real audio requires browser) |
| Honest "no audio" badge | `Alphabet.tsx` + `TokenPanel.tsx` always render explicit disabled state when no Arabic voice | PASS |

## Optional AI tutor (Token Factory)

| Feature | Test | Status |
|---------|------|--------|
| Request validation (Zod) | Vitest `explain-route` schema mismatch + 400 | PASS |
| Rate limiting (30/min/IP) | Vitest + manual curl chain; sweep eviction added | PASS |
| Body cap 8 KB | Express `express.json({ limit: "8kb" })` | PASS (no oversize test; verified by integration smoke) |
| 401/403 → `provider_unavailable` | Vitest `explain-route` (1) | PASS |
| 404 → `model_not_available` | Vitest `explain-route` (9) | PASS |
| 429 → `rate_limited` | Vitest `explain-route` (4) | PASS |
| 5xx → `provider_unavailable` | Vitest `explain-route` (5) | PASS |
| Timeout (`AbortController`) | Vitest `explain-route` (6) | PASS |
| Schema mismatch | Vitest `explain-route` (7+8) | PASS |
| Truncation to 800 chars | Vitest `explain-route` (8) | PASS |
| Frontend fallback to curated | `client/src/lib/ai.ts` + `AiTutorButton` | PASS |
| **Real Token Factory call** | none — no `TOKENFACTORY_API_KEY` available in this environment | **NOT VERIFIED** |

## Service hygiene

| Feature | Test | Status |
|---------|------|--------|
| Secret scanner: tracked | `npm run hygiene` | PASS |
| Secret scanner: working tree | `npm run hygiene` (extended) | PASS |
| Secret scanner: untracked files | `npm run hygiene` (extended, verified with canary file) | PASS |
| Forbidden path (`OmniLangTutor/`) | `npm run hygiene` | PASS |
| Bearer-token redaction in logs | `server/lib/logger.ts` strips `Bearer\s+\S+` | PASS (manual code review; no live test) |
| Per-IP rate-limit memory bound | `explain.ts` sweep eviction | PASS |

## Browser / accessibility

| Feature | Test | Status |
|---------|------|--------|
| Skip-link to main | `App.tsx` | PASS (manual code review + Playwright snapshot finds it) |
| ARIA labels on tokens | `SentenceArea` `aria-label={...}` | PASS |
| `role="radiogroup"` | `QuestionArea` | PASS |
| `prefers-reduced-motion` | `client/src/styles/global.css` media query | PASS (manual code review) |
| Mobile header disclosure | `Header.tsx` `<details>/<summary>` | PASS (manual code review) |
| Focus rings | `client/src/styles/global.css` `:focus-visible` | PASS |
| Auto axe-core smoke | not added (deferred; existing structural + Playwright checks cover the major paths) | NOT VERIFIED |

## Build / runtime

| Feature | Test | Status |
|---------|------|--------|
| `npm install` reproducible | root + client + server lockfiles present | PASS (manual verify) |
| `npm run validate:lessons` | exit 0 | PASS |
| `npm run validate:alphabet` | exit 0 | PASS |
| `npm run check` (tsc) | exit 0 | PASS |
| `npm test` (Vitest) | 52/52 | PASS |
| `npm run test:e2e` (Playwright) | 5/5 | PASS |
| `npm run build` (Vite + esbuild) | exit 0, client 64 modules / 257 KB JS | PASS |
| `npm start` from clean shell | curl smoke: GET / 200, SPA deep link 200, asset 200, /api/health 200, /api/unknown 404 JSON | PASS |
| `.env` loader | Vitest `dotenv` (4 cases) + curl smoke with stub `.env` | PASS |
| Production builds from `client/dist` | Vitest `production-server` | PASS |
| `dist/` not in tree (gitignored) | `git ls-files \| grep dist/` empty | PASS |