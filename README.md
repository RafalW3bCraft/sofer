# sofer — Learn your first Arabic sentences

[![CI](https://github.com/RafalW3bCraft/sofer/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/RafalW3bCraft/sofer/actions/workflows/ci.yml)

sofer is a calm, accessible web app that teaches **Modern Standard Arabic**
to English-speaking complete beginners through short curated lessons and
**tappable tokens on real sentences**. The optional "Explain with AI tutor"
feature calls a Token Factory chat-completions endpoint (Nebius Token
Factory by default) through a tightly scoped server proxy.

This repository was built for the Devpost **Build With AI: Basics** hackathon
(2026), following the official Devpost Learn Skill Pack (`1-start` through
`6-ship`).

## Quick start

Requires **Node.js 22 LTS or newer** (Node 24 LTS preferred for production
deployments; developed and CI-verified against Node 22 / 24 / 26). Node 20
reached end-of-life in 2026 and is no longer a supported runtime for this
project.

```bash
# 1. Install
npm install
npm --prefix client install
npm --prefix server install

# 2. Run in development (Vite dev server at :5173, Express server at :3001)
npm run dev

# 3. Open http://127.0.0.1:5173/
```

The frontend proxies `/api/*` to the backend at `http://127.0.0.1:3001`, so
the AI tutor endpoint works out of the box.

## Production-style local preview

```bash
npm install
npm --prefix client install
npm --prefix server install
npm run build       # builds client (Vite) and server (esbuild)
npm start           # serves the built client + API at http://127.0.0.1:3001
```

## Optional: enable live AI tutor

Copy `.env.example` to `.env` and fill in your Token Factory credentials:

```bash
cp .env.example .env
# edit .env and set TOKENFACTORY_API_KEY to your real key
```

`POST /api/ai/explain` will then return real schema-validated explanations.
Without a key, the endpoint returns a structured `503 provider_unavailable`
and the UI shows the curated fallback explanation with an "AI tutor
unavailable — using curated explanation" status pill.

### Token Factory providers

"Nebius Token Factory" and "AMD Radeon Cloud Token Factory" are **two
different providers** with separate accounts and keys — not regions of one
service. A key issued by one returns 401 at the other. Both speak the same
OpenAI-compatible shape:

- `https://api.tokenfactory.nebius.com/v1` — Nebius Token Factory. This is
  the provider of the verified live credential for this submission, and the
  server default.
- `https://developer.amd.com.cn/radeon/api/v1` — AMD Radeon Cloud Token
  Factory (China site), documented at <https://amd-aim.github.io/radeon-cloud-docs/api/overview/>.
  Requires its own AMD-issued key; AMD documentation describes it as
  development / trial use. **Not live-tested for this submission.**

Pick the endpoint that matches the account that issued your key. After pointing
`TOKENFACTORY_BASE_URL` at the right host, run
`npm run smoke:live` to confirm `GET /models` returns 200 and your
chosen `TOKENFACTORY_MODEL` is in the list. See
`docs/release/live-smoke.md` for the verified smoke output.

See `devpost/spec.md > External Services and Dependencies > Token Factory
provider` for the exact request/response shape.

## What you can do in sofer

- Open the homepage and click **Start Learning**.
- Choose a lesson (3 topical lessons: Greetings, Numbers, Directions).
- Read a fully-vowelled beginner Arabic sentence with verified English meaning.
- Tap any Arabic word → see its contextual meaning, part of speech, and a
  one-sentence grammar note. Optionally play pronunciation with the browser's
  speech synthesis when an Arabic voice is available.
- Use **keyboard navigation**: Tab moves between tokens, Arrow Left/Right
  steps within a sentence, Enter/Space opens the panel, Escape closes.
- Answer a 4-option multiple-choice question. Curated explanations teach the
  *why*, not just the score.
- Mark any token as "tricky" to revisit it from the Progress screen.
- Reload and your progress (lessons completed, accuracy, tricky tokens) is
  still there. A "Reset progress" action clears it.
- Browse the **28-letter Arabic alphabet** at `/alphabet`.

## Tests

```bash
# Lesson + alphabet schema validation
npm run validate:lessons
npm run validate:alphabet

# Unit + integration tests (Vitest)
npm test

# Browser end-to-end tests (Playwright)
# First time only:
npx playwright install chromium
# Then:
npm run test:e2e

# Hygiene audit (no secrets, no OmniLangTutor in tracked tree)
npm run hygiene
```

## Architecture

```
sofer/
├── client/                 React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── pages/          Home, LessonList, LessonPlayer, Alphabet, Progress
│   │   ├── components/     Header, SentenceArea, TokenPanel, QuestionArea, AiTutorButton
│   │   ├── lib/            storage, grading, speech, ai
│   │   └── content/        lessons.json, alphabet.json (curated content)
│   └── vite.config.ts      Dev server :5173 with /api proxy -> :3001
├── server/                 Node + Express + TypeScript
│   ├── index.ts            Express bootstrap, /api/health, /api/ai/explain
│   ├── routes/explain.ts   POST /api/ai/explain with rate limit
│   ├── lib/                tokenfactory adapter, safe logger
│   └── build.ts            esbuild production build
├── shared/schemas.ts       Zod schemas (client + server)
├── scripts/                validate-lessons, validate-alphabet, hygiene
├── tests/                  unit/, integration/, e2e/
└── devpost/                Planning artifacts (scope, prd, spec, checklist, app-map)
```

See `devpost/spec.md` for the full architecture, `devpost/app-map.html` for
a visual tour, and `devpost/checklist.md` for the build verification matrix.

## What's deferred (out of scope for the POC)

- User accounts / cloud sync
- More than the curated 7 sentences
- Dialect tracks (Egyptian, Levantine, etc.)
- Speech recognition / pronunciation scoring
- AI-generated sentence content
- Production hosting (the README documents a static-host path; the project
  is verified locally)

## Inspiration

The original idea for the kernel — *tappable tokens on real beginner
sentences* — is borrowed conceptually from the author's earlier project,
`OmniLangTutor`. OmniLangTutor is **not** part of this submission; it is kept
inside this directory only as a read-only reference under `OmniLangTutor/`
(ignored by `.gitignore` and not tracked). The two share an idea, not code:
this repo is a fresh React + Express + TypeScript application with a
new Arabic-first curriculum, no Firebase/PostgreSQL/passport, no
position-based token alignment, no simulated AI responses, and a single
clearly-labeled AI provider (Token Factory — Nebius by default).

## License

MIT — see [LICENSE](./LICENSE).