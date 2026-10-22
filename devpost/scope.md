---
doc: scope
status: draft
---

# sofer

One line: a calm, accessible web app that teaches Modern Standard Arabic to complete beginners through short lessons, contextual word inspection, and an optional AI tutor.

## The Unique Kernel
Beginners struggle with Arabic because the script, morphology, and grammar are unfamiliar at every level. sofer's distinctive move is **tappable tokens on real beginner sentences**: every Arabic word and meaningful morpheme in the curated sentences can be tapped to see its contextual meaning, grammatical role, and how it relates to English — without aligning translations by position and without inventing explanations. The optional Token Factory tutor adds a brief, schema-validated English explanation on demand, clearly labeled as AI-generated and never overriding the curated answer key.

## Who It's For
A specific person: an English-speaking adult who has decided to start learning Modern Standard Arabic on their own, has no prior Arabic, and bounced off Duolingo-style apps because they didn't explain *why* words mean what they mean or how the sentence is put together. They want a quiet place to read five real beginner sentences, understand each word, answer one comprehension question, and feel that progress actually moved somewhere. Today they google "learn Arabic for beginners," land on scattered blog posts, and give up inside a week.

## The Core Loop
1. Open sofer. Land on the homepage with a single obvious **Start Learning** action.
2. Choose the first lesson (a small set of curated MSA beginner sentences grouped into a few topical buckets — greetings, numbers, directions, food, etc.).
3. Read the Arabic sentence, see the English translation, optionally expand the transliteration.
4. Tap any Arabic word to inspect it: contextual meaning, part of speech, grammar note, optional pronunciation audio (browser speech synthesis).
5. Answer one multiple-choice comprehension question. Get immediate feedback with a curated explanation of the right and wrong answers.
6. See the lesson marked completed; progress (lessons completed, accuracy, last activity) appears on a Progress screen.
7. Optional: tap "Explain with AI tutor" on a word or sentence. If the Token Factory backend is reachable and a model responds, an English explanation appears, clearly labeled as AI-generated. If not, the curated explanation is shown instead and a small status pill says "AI tutor unavailable."

The reason they come back is that progress feels real (persisted, versioned, derived from actual attempts), the next lesson is always one click away, and the explanations actually teach something instead of just confirming the answer.

## Inspiration & Identity
- Concept reference: OmniLanguageTutor (the learner's previous project). The kernel is the same — *tappable tokens on real sentences* — but the new application drops Spanish, hard-coded `gpt-4o`, simulated conversations, position-based token alignment, the PostgreSQL/Firebase/passport stack, and the no-lockfile build.
- Hackathon: Devpost "Build With AI: Basics" 2026. The official Devpost Learn Skill Pack (1-start → 6-ship) is the planning authority. Planning docs live under `devpost/`.
- Aesthetic: calm, contemporary educational product. Warm neutral base, deep charcoal text, one restrained accent color, generous whitespace, clear focus indicators, mobile-first responsive layout. English UI chrome; Arabic content blocks isolated as RTL. No neon gradients, no glassmorphism, no decorative animation, no dashboards full of fake metrics.
- Token Factory: AMD Radeon Cloud Token Factory, OpenAI-compatible chat completions. Server-side only. The application's `TOKENFACTORY_*` settings are environment-driven; with no credential the AI tutor endpoint serves the curated fallback and reports "unavailable" honestly.

## Why This Matters to the Learner
The learner is rebuilding their previous language-tutor project as a focused, accessible Arabic-first proof of concept, with verified engineering rather than a sprawling unfinished platform. They want to demonstrate to themselves (and to Devpost reviewers) that a small, carefully built POC with honest integration — including the AI tutor — can teach real Arabic to real beginners.

## What "Working" Looks Like
A stranger can clone `https://github.com/RafalW3bCraft/sofer`, follow `README.md`, run `npm install && npm run dev`, open the homepage, click **Start Learning**, complete one full lesson end-to-end (read → tap a word → answer a comprehension question → see feedback), reload the page, and see their progress still there. If `TOKENFACTORY_API_KEY` is set in `.env`, tapping "Explain with AI tutor" produces a real schema-validated English explanation. If it is not set, the same tap shows the curated explanation with a small "AI tutor unavailable" status. The demo video walks through that flow in under three minutes.

## The POC Boundary
**In.**
- Five curated MSA beginner sentences grouped into 2–3 topical lessons.
- Introductory Arabic alphabet page (28 letters + a few key diacritics) as the second main experience.
- Per-token tap-to-inspect with curated annotations (meaning, part of speech, grammar note, optional transliteration).
- One multiple-choice comprehension question per sentence with deterministic grading and curated correct/incorrect explanations.
- Versioned localStorage progress (lessons completed, accuracy, last activity, last lesson pointer) with safe recovery from corrupted storage.
- Minimal Node/Express backend exposing `POST /api/ai/explain` behind a narrowly scoped schema-validated request. Mock-tested. Live-testable when `TOKENFACTORY_API_KEY` is configured.
- Browser speech synthesis for the inspected word/phrase when an Arabic voice is available; honest "no Arabic voice" fallback otherwise.
- Static, accessible, mobile-first React + TypeScript + Vite frontend.
- Real automated tests: unit (lesson schema validation, token lookup, grading), integration (server route with mock Token Factory), browser E2E (one full lesson flow with Playwright).
- README, LICENSE, `.env.example`, planning docs, app map, security notes, honest limitations.

**Out (for this POC).**
- User accounts, login, multi-device sync, cloud progress.
- PostgreSQL, Firebase, passport, sessions, OAuth.
- Hard-coded `gpt-4o` calls, simulated conversations, position-based token alignment.
- A dictionary / vocabulary list / spaced repetition.
- Sentence generation, conversation buddy, cultural context panels.
- Pronunciation scoring, speech recognition, accent analysis.
- More than five sentences in the MVP module.
- Production deployment beyond `npm run preview` locally. (Deployment is optional per the hackathon rules; the README documents a static-host path but does not publish.)

## Later
Worth doing, just not now.
- Real CEFR-aligned curriculum with 50+ sentences across more topics.
- Spaced repetition on missed tokens.
- Dialect awareness (Egyptian, Levantine) clearly labeled as separate modules.
- Pronunciation practice with speech recognition.
- Token Factory–powered follow-up questions a learner can ask about a lesson.
- Optional deployment to a static host (Netlify, Vercel, Cloudflare Pages).

## Explicitly Cut
- **Spanish teaching content, Spanish prompts, `es-ES` voice, Spanish locale assumptions.** Cut: the predecessor project was Spanish-focused; the new product is explicitly Arabic-only.
- **Firebase auth + passport + sessions + PostgreSQL + Drizzle migrations.** Cut: not needed for the MVP; replace with localStorage. The predecessor project carried significant auth and DB weight that added zero value to a guest learner.
- **Simulated conversation buddy.** Cut: the predecessor's `ConversationBuddy` produced hard-coded "AI-looking" responses. Real integration only, or no integration at all.
- **Position-indexed word alignment.** Cut: Arabic and English do not share word counts, so position-based alignment was always going to teach the wrong thing.
- **Hard-coded `gpt-4o` model.** Cut: replaced with configurable `TOKENFACTORY_MODEL` validated against the provider's actual model list.
- **Open URL-import endpoint.** Cut: the predecessor's `ImportDictionary` had unsafe URL-import potential. Not in scope; not rebuilt.
- **Bundled `node_modules` / no-lockfile build.** Cut: new project ships with a committed lockfile and a clean reproducible install.