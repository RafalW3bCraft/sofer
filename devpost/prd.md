---
doc: prd
status: draft
---

# sofer — Product Requirements

One line: a calm, accessible web app that teaches Modern Standard Arabic to complete beginners through short lessons, contextual word inspection, and an optional AI tutor.

Source: `scope.md > [Project Name]`, `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`, `scope.md > The POC Boundary`.

## The Core Journey

The complete path, end to end — arrival, first use, the core loop, what counts as success. Numbered steps in plain language, concrete enough that a stranger could follow along. This is the spine of the document; everything below elaborates on it.

1. **Arrival.** The learner visits `https://rafalw3bcraft.github.io/sofer` (or runs `npm run dev` locally). The landing page loads in under 2 seconds on a modern device, shows the wordmark "sofer" and one sentence of plain-English framing ("Learn your first Arabic sentences."), and one obvious **Start Learning** button. No registration, no paywall, no "pick your dialect" dialog.
2. **First lesson.** Clicking **Start Learning** opens the first lesson, a curated MSA greeting ("ٱلسَّلَامُ عَلَيْكُمْ" — *Peace be upon you*). The Arabic phrase appears in a large, RTL-corrected display with the English translation below. A small "Show transliteration" toggle reveals an optional beginner transliteration. A "1 of 5" indicator shows progress through the lesson.
3. **Inspect a word.** The learner taps any Arabic word. A side panel opens (or an inline expansion on small screens) showing: the Arabic word, its transliteration, its contextual English meaning in this sentence, its part of speech, a one-sentence grammar note, and a "Listen" button that uses the browser's speech synthesis with an Arabic voice if available. No scripted "AI" explanation appears unless the learner taps "Explain with AI tutor."
4. **Comprehension check.** Below the sentence is one multiple-choice question with four answer options. The learner picks one. The grading is deterministic (compare to the curated correct answer). On submit, the chosen option is marked correct or incorrect, the correct answer is highlighted, and a curated explanation appears ("*Saying the greeting is a fixed religious and cultural expression. The 'u' ending makes it formal/polite.*"). No fabricated scoring; no randomized AI answer.
5. **Lesson complete.** After the comprehension question, the lesson is marked complete and progress is persisted to versioned localStorage (`sofer.progress.v1`). A "Next lesson" button advances; a "Back to lessons" button returns to the lesson list.
6. **Progress review.** The learner opens the **Progress** screen. They see: lessons completed (count + list), total comprehension questions answered, accuracy percentage, and last activity timestamp. All values are derived from real persisted events. A "Reset progress" button is present, with a confirmation step, that clears progress.
7. **Optional AI tutor.** On any word or sentence, the learner can tap **Explain with AI tutor**. The frontend posts a small schema-validated request to `POST /api/ai/explain`. The backend forwards to Token Factory if `TOKENFACTORY_API_KEY` is set and the provider responds successfully. The response is validated against the response schema. If anything fails (no key, network error, 401/429/5xx, schema mismatch, timeout, cancellation), the backend returns a structured 503 with `reason: "provider_unavailable"`, and the frontend shows the curated fallback explanation with a small "AI tutor unavailable — using curated explanation" status pill. **The tutor never marks a lesson complete and never overrides the curated answer key.**
8. **Return visit.** The learner closes the tab, comes back the next day. They land on the homepage; the lesson list shows their previous progress; "Next lesson" picks up where they left off.

## Screens and Layout

Five surfaces, all mobile-first responsive, all keyboard-accessible, all using semantic HTML and ARIA where appropriate.

1. **Home.** `/`. Wordmark, one-sentence framing, **Start Learning** button, secondary links to "Alphabet" and "Progress". No nav drawer, no hero image, no marketing copy block.
2. **Lesson list.** `/lessons`. A vertical list of available lessons, each showing title, topical bucket, completion state, and a "Start" / "Review" button. Completed lessons show a small check.
3. **Lesson player.** `/lessons/:lessonId`. Three vertically stacked regions: (a) sentence area with Arabic, English, transliteration toggle, and per-word tap targets; (b) comprehension question with answer options; (c) feedback area, hidden until answered. A small header shows lesson title, "X of N" progress, and a "Back" link.
4. **Alphabet intro.** `/alphabet`. A grid of the 28 Arabic letters with their names, basic forms, and a "Listen" button for each. A small section explains short vowels (الحركات). This is the second main experience and the only place where letter-level content appears in the POC.
5. **Progress.** `/progress`. Derived-from-events panel: lessons completed (count + list), questions answered (count), accuracy %, last activity timestamp, and a "Reset progress" action with confirmation. Honest counts only — no fake streaks, no fake achievements.

Navigation: a small persistent header with the wordmark "sofer" on the left and three links — **Learn · Alphabet · Progress** — on the right. On mobile, the three links collapse into a single "Menu" button that opens a focus-trapped disclosure.

## Look and Feel

Carried from `scope.md > Inspiration & Identity`. Direction the build agent can act on.

- **Palette.** Warm off-white background (`#FAF8F4` or equivalent). Deep charcoal text (`#1F1B16`). One restrained accent color (suggested: a muted teal `#3A7D7B`) used for focus rings, primary buttons, and active states. No gradients, no glassmorphism.
- **Typography.** System UI stack for English chrome (Inter / SF Pro / Segoe UI fallback). For Arabic, the system Arabic font stack (system-ui Arabic) with verified glyph coverage. Optional: `Noto Naskh Arabic` from Google Fonts if system coverage is insufficient; documented in README if added.
- **Density.** Spacious and calm. Generous whitespace. Max content width ~720 px on desktop, full width with padding on mobile. Vertical rhythm of 1.5 line-height.
- **Energy.** Quiet. No motion beyond CSS focus transitions and the lesson-completion checkmark. Reduced-motion preference respected (`prefers-reduced-motion` disables even focus transitions).
- **Tone of interface copy.** Plain English. No jargon like "RTL," "MSA," "CEFR" on the main flow. The Arabic alphabet page is the only place where Arabic linguistic terminology is introduced, and even there it is paired with English.
- **References to avoid.** No dashboards full of streaks, no neon gradient hero, no glassmorphic cards, no decorative animation, no fake testimonials, no AI chatbot on the homepage.

## Features and Behavior

### Lesson content
Curated MSA beginner sentences, newly authored for this project. Each sentence has: id, lesson id, topic, difficulty (`A1`), Arabic text with full diacritics, English translation, optional transliteration, ordered list of tokens (Arabic text spans, English meaning, part of speech, grammatical role, grammar note), one comprehension question with four options and a curated explanation for the correct answer and each incorrect distractor. No translation generated at runtime; no AI produced sentence text.

### Token inspection
Tap a token in the sentence area. The token panel shows: Arabic, transliteration, contextual English meaning in *this* sentence (not a generic dictionary gloss), part of speech, one-sentence grammar note, optional "Listen" button. Pronunciation uses `window.speechSynthesis` with `lang="ar"`; if no Arabic voice is available, the button is disabled with a tooltip explaining why.

### AI tutor (optional)
Tap "Explain with AI tutor" on a token or the whole sentence. Frontend posts `{ context: "word" | "sentence", arabic: string, lessonId: string, tokenIndex?: number }` to `POST /api/ai/explain`. Backend validates, calls Token Factory with a tight schema-validated prompt, returns `{ explanation, generated_at, model, cached }` on success, or `{ error, reason }` on failure. Frontend renders `explanation` as plain text (never HTML) and shows a "Generated by AI" badge. Failures show the curated fallback with the "AI tutor unavailable" status.

### Progress tracking
Versioned localStorage key `sofer.progress.v1`. Shape: `{ schemaVersion: 1, lessons: { [lessonId]: { completedAt, lastQuestionCorrect } }, totalQuestionsAnswered, totalQuestionsCorrect, lastActivityAt }`. On read, if the JSON is missing, malformed, or `schemaVersion` is unsupported, the app starts fresh without throwing and offers a one-click "Continue" with the cleared state. Reset clears the key entirely.

### Persistence boundary
No server-side persistence in the POC. localStorage only. No account. The submission documents this explicitly in the README.

### Browser speech synthesis
Used only for "Listen" buttons. No microphone access, no speech recognition, no pronunciation scoring. If the browser does not expose `speechSynthesis` or no Arabic voice is enumerated, the button is hidden and a small explanatory note appears in its place.

## States and Boundaries

- **First use.** No progress stored. Lesson list shows all lessons as not started. The alphabet page is fully accessible.
- **Normal use.** Progress persists across reloads. Lesson list shows completion state. "Next lesson" advances.
- **Empty state on Progress.** Before any lesson is completed, Progress shows a short message ("Start your first lesson to see progress here.") and a link to lessons.
- **AI tutor unavailable.** When Token Factory is not configured or unreachable, the tutor panel shows the curated fallback explanation and a small "AI tutor unavailable — using curated explanation" status. The UI never fabricates an AI response.
- **Arabic voice unavailable.** The "Listen" button is hidden or disabled with a one-line explanation. The rest of the lesson works.
- **Corrupted localStorage.** On any JSON parse error or schema mismatch, the app clears the broken key (after showing a one-time inline notice) and starts fresh. No data loss for the learner (since there is no server data), no crash.
- **Token Factory returns a non-schema response.** Backend returns 503 with `reason: "schema_mismatch"`. Frontend shows the curated fallback.
- **Reduced motion.** All non-essential transitions are disabled via `@media (prefers-reduced-motion: reduce)`.
- **Keyboard only.** Every interactive element is reachable with Tab and operable with Enter / Space. Focus rings visible against the warm-neutral palette.

## Product Decisions

- **Five sentences in the MVP, not twenty.** The learner prioritizes a working end-to-end loop over breadth. Twenty sentences would either ship with shallow annotations or be deferred past the deadline.
- **Modern Standard Arabic only.** No dialect selection. Egyptian / Levantine / Gulf are explicitly later modules.
- **No accounts in the MVP.** Versioned localStorage only. The kernel ("tap a token, see a real explanation") does not need a server identity.
- **Optional AI tutor, not required.** The lesson flow works without `TOKENFACTORY_API_KEY`. The tutor enhances but never gates.
- **Token Factory only.** Per the latest directive, no other AI provider is authorized. The adapter is configurable but the application is shipped with Token Factory as the only supported target.
- **Curated content as source of truth.** AI explanations never override the curated answer key. AI responses are labeled and treated as untrusted.
- **Mobile-first.** The primary use case is "open on phone for 5 minutes." Desktop is the second viewport, not the first.

## What We're Building
A new public GitHub repository at `https://github.com/RafalW3bCraft/sofer` containing:
- A working React + TypeScript + Vite frontend implementing the five surfaces above.
- A small Node + Express backend exposing `POST /api/ai/explain` behind schema-validated input/output, with a configurable Token Factory adapter and a mock server for tests.
- Five curated MSA beginner lessons with full per-token annotations.
- A 28-letter Arabic alphabet intro page.
- Versioned localStorage progress with corruption recovery.
- Browser speech synthesis for pronunciation.
- Real automated tests: unit (lesson schema, grading, storage), integration (server with mock Token Factory), browser E2E (one full lesson flow with Playwright).
- Reproducible install: committed `package-lock.json`, documented Node version, `.env.example` with safe defaults.
- README, LICENSE (MIT), planning docs under `devpost/`, app map, security notes, honest limitations, demo instructions.
- A demo video under 3 minutes that records the real running application.

## Deferred From the POC
- **Account system.** "Sign in to save your progress across devices" — out of scope for a guest POC.
- **Spaced repetition on missed tokens.** Defer until the core loop is verified working.
- **Dialect modules.** Egyptian, Levantine, etc., as labeled separate tracks.
- **Speech recognition / pronunciation scoring.** Browser APIs exist but reliable scoring is a research project of its own.
- **Sentence generation by AI.** Curated content only; AI generation risks hallucinated Arabic.
- **Production deployment.** Static hosting is documented in the README but not actually published as part of the POC submission.

## Possible Later Enhancements
- 50+ sentence corpus across more topics (food, travel, family, time, weather), with audio.
- Dialect tracks, each labeled clearly.
- Token Factory–powered free-form Q&A on a lesson ("What does this word mean in Egyptian Arabic?").
- PWA support for offline use.
- Optional cloud progress sync behind a small account system.

## Non-Goals
- **Multi-language platform.** sofer teaches Arabic only. Not a generic tutor framework.
- **Replacing a teacher.** A proof of concept for self-study, not a substitute for a course.
- **Real-time collaboration.** No shared sessions, no live tutoring.
- **Native mobile apps.** Web only for the POC.

## Open Questions
- **Token Factory model selection.** Not established. Will be resolved during `4-spec` by reading the actual provider model list and selecting a model with Arabic competence and structured-output support. **Must be answered before** the AI tutor endpoint is wired to the live provider; can be mocked before then.
- **Alphabet content depth.** How many diacritics, how many letter forms (isolated / initial / medial / final). Default: isolated form only in the POC grid; full forms documented but not interactive. **Can wait** until the alphabet page is being built.
- **Transliteration scheme.** ALA-LC, ISO 233, or a learner-friendly simplified scheme. Default: simplified learner-friendly scheme with a small legend on the alphabet page. **Can wait** until the lessons are written.