# OmniLangTutor parity (feature-family level only)

The predecessor project lives at `./OmniLangTutor/` (git-ignored). This document
catalogs OmniLangTutor's feature families, sofer's equivalence, evidence of
working proof in sofer, and an honest gap classification.

Per the finalization directive, OmniLangTutor's source is **not** copied into
the sofer submission. Where sofer covers a family, the implementation is
independent. Where sofer does not cover a family, it is explicitly deferred
to a post-hackathon roadmap.

## Parity matrix

| OmniLangTutor family | Predecessor evidence (file path / behaviour) | sofer equivalence | Working proof in sofer | Gap | Hackathon relevance | Dependency | Clean-room plan | Priority |
|---|---|---|---|---|---|---|---|---|
| Login / Auth / Profile | `client/src/contexts/AuthContext.tsx`, `client/src/pages/Login.tsx`, `client/src/pages/Profile.tsx` | None — localStorage guest learner only | n/a | MISSING | Out of POC scope; PRD §"Persistence boundary" rules it out | None | None for POC | LOW (post) |
| Dashboard | `client/src/pages/Dashboard.tsx` | None — sofer replaces dashboards with a calm Progress panel | n/a | MISSING | Sofer's PRD explicitly rejects dashboards full of streaks | None | None | LOW (post) |
| Dictionary Search | `client/src/pages/DictionarySearch.tsx` | Partial — TokenPanel gives contextual meaning for tokens in the curated 7 sentences | Vitest `progress-domain`, Playwright token panel test | PARTIAL — no arbitrary dictionary lookup; curated only | Acceptable for a 7-sentence POC; dictionary is a separate product | None | None | LOW (post) |
| Import Dictionary | `client/src/pages/ImportDictionary.tsx` | None | n/a | MISSING — and the PRD explicitly CUTS URL-import | Out of scope; security review in predecessor flagged this | None | None | LOW (post) |
| Database Management | `client/src/pages/DatabaseManagement.tsx`, `server/db.ts`, `server/db-migrations.ts` | None | n/a | MISSING | No DB in sofer by design; localStorage only | None | None | LOW (post) |
| Learning / practice + exercise generation | `client/src/pages/Learning.tsx`, `server/learning-routes.ts` | sofer `LessonPlayer` + per-sentence MCQ; content is curated, not generated | Vitest `grading`, Playwright full-flow | MATCH on the curated path; generated-exercise path is MISSING | POC needs only curated exercises to demonstrate the kernel | None | None | LOW (post) |
| Structured curriculum tracks | `server/services/curriculum.ts`, `server/storage-curriculum.ts`, `server/curriculum-routes.ts` | sofer `lessons.json` schema (Lesson, Sentence, Token, Question) | `npm run validate:lessons`, lessons-schema tests | MATCH on structure; missing CEFR ladder, multi-level progression | A1 only is the POC boundary | None | A1 -> A2 expansion is post | MEDIUM (post) |
| Sentence Generator (AI) | `client/src/components/learning/SentenceGenerator.tsx`, `server/services/llm.ts` | None — curated-only by design | n/a | MISSING | PRD §"Product Decisions" explicitly cuts AI-generated sentences | None | None | LOW (post) |
| Conversation Buddy | `client/src/components/learning/ConversationBuddy.tsx` | None | n/a | MISSING | PRD explicitly CUTS simulated conversations | None | None | LOW (post) |
| Cultural Context / idioms | `client/src/components/learning/CulturalContext.tsx`, `server/cultural-context-routes.ts`, `server/services/cultural-context.ts` | Implicit — curated grammar notes touch on cultural points (e.g. `ٱلسَّلَامُ عَلَيْكُمْ` is "a fixed religious and cultural greeting") | lessons.json content review | MATCH at note level; no separate cultural panel | Acceptable for POC | None | None | LOW (post) |
| Settings / themes | `client/src/components/theme/ThemeProvider.tsx`, `client/src/components/theme/ThemeToggle.tsx`, `client/src/pages/Settings.tsx` | None — uses OS light/dark via `prefers-color-scheme` is NOT wired in sofer yet; CSS variables only | n/a | MISSING for explicit toggle; PASS for default theme via CSS tokens | Acceptable; explicit toggle is a polish item | None | Optional CSS toggle post-POC | LOW (post) |
| Speech input / TTS | OmniLangTutor had `SpeechRecognition` integration; sofer uses `window.speechSynthesis` only | MATCH on TTS only; speech recognition MISSING | Vitest `speech-status` (5 cases incl. async voice load) | MATCH on output, MISSING on input | PRD §"States and Boundaries" explicitly notes no pronunciation scoring | Browser `SpeechSynthesis` | None for input | LOW (post) |
| Saved items | `client/src/lib/firebase.ts`, `client/src/pages/Dashboard.tsx` | Partial — sofer has "tricky tokens" stored in `sofer.tokens.v1` | Vitest storage migration, Playwright `Mark as tricky` + `Jump to lesson` | PARTIAL — tricky is per-token not per-vocab-entry | Acceptable | None | Vocabulary list post-POC | LOW (post) |
| Learning history / progress | `server/storage.ts`, `server/routes.ts` (progress endpoints) | sofer `ProgressV2` schema + `client/src/lib/progress.ts` + `client/src/pages/Progress.tsx` | Vitest `progress-domain` (15), Playwright (1)(3) | MATCH on the local-only case; MISSING cross-device | PRD §"Persistence boundary" rules out server-side progress | None | None | LOW (post) |
| API / DB routes | `server/routes.ts`, `server/learning-routes.ts`, etc. | sofer `POST /api/ai/explain` only | Vitest `explain-route` (9) + `production-server` (4) | PARTIAL — only the AI endpoint | Acceptable; the rest of the app needs no API | None | None | LOW (post) |
| LLM layer | `server/services/llm.ts`, `server/services/openai.ts` | sofer `server/lib/tokenfactory.ts` (single provider adapter) | Vitest `explain-route` | MATCH on adapter pattern; provider is Token Factory only | The PRD commits to Token Factory as the single supported provider | `TOKENFACTORY_API_KEY` (optional) | None for POC | LOW (post) |

## Hackathon guardrail

The official competition calls for a NEW small POC. OmniLangTutor covers ~13
feature families; sofer ships a focused subset on purpose. Deferred items are
listed above as MISSING/PARTIAL with no in-POC work scheduled. No placeholder
buttons, no fake counts, no filler. The sofer UI never presents incomplete
features as complete.

## Post-submission roadmap (one-line each)

1. User accounts + cross-device sync (Firebase or simple email-magic-link).
2. CEFR-aligned curriculum: extend `lessons.json` with A2 + B1 topics.
3. Vocabulary list + spaced repetition on missed tokens.
4. Speech-recognition practice on isolated tokens (with explicit "not a
   pronunciation grader" labeling).
5. Optional deployment to a static host with a Node API.

No further OmniLangTutor feature families are planned for the POC.