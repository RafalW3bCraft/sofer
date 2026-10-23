# Baseline Audit

Captured before any code changes from the Hermes finalization directive.
Re-execution follows the systematic INSPECT -> REPRODUCE -> FIX -> VERIFY loop.

## Environment

- Host: Linux 7.2.3-arch1-3
- Working dir: `/home/sp3ct0r/sofer-hackathon`
- Node: v26.7.0
- npm: 11.19.0
- Branch: `main`
- HEAD: `1d48212b5bc9e3d68199bc704010ab26c019ff48`
- Remote: `https://github.com/RafalW3bCraft/sofer.git`
- Untracked: `sofer_hermes_finalization_2026-10-23.md`

## Mechanical reproduce

| Step | Command | Outcome | Notes |
|------|---------|---------|-------|
| Validate lessons | `npm run validate:lessons` | PASS | 3 lessons, 7 sentences, 18 tokens all with valid offsets |
| Validate alphabet | `npm run validate:alphabet` | PASS | 28 unique letters, 3 diacritics |
| Type check | `npm run check` | PASS | client + server both clean |
| Unit + integration | `npm test` | PASS | 4 files, 18/18 tests |
| Hygiene | `npm run hygiene` | PASS | 60 tracked files scanned, no secrets / forbidden paths |
| Build | `npm run build` | PASS | client 62 modules / 254 KB JS, server esbuild output |
| Production start | `env -i HOME=$HOME PATH=$PATH npm start` (no `NODE_ENV`) | **FAIL** | `GET /` returns HTTP 404; static assets never registered; SPA deep links 404; unknown routes return `text/html` "Cannot GET" instead of API 404 |
| Production start with NODE_ENV | `NODE_ENV=production npm start` | (not yet executed before fix) | Will verify after P0-A fix |

### Reproduced defects

- **P0-A — production serving.** `server/index.ts` registers the static SPA fallback only when `process.env.NODE_ENV === "production"`, but `server/package.json`'s `start` script runs `node dist/index.js` without setting `NODE_ENV`. From a fresh shell the built bundle is never served and `GET /` returns `Cannot GET /`. Verified above with a clean `env -i` invocation.
- **P1-C — lesson completion set after first question.** `LessonPlayer.handleAnswer` (lines 85–109) writes `lessons[lesson.id].completedAt` on the first submitted answer. A 3-sentence lesson therefore appears complete in `LessonList` after the first question alone.
- **P1-D — deep-link resume never consumed.** `Progress.tsx` builds `#${tokenId}` hash links; `LessonPlayer` never reads `useLocation().hash`, so clicking "Jump to lesson" does not focus the exact sentence / token.
- **P1-E — speech status memoized once.** `Alphabet.tsx` uses `useMemo(() => getArabicSpeechStatus(), [])`; the page never re-renders after `voiceschanged`. A browser that initially reports no Arabic voice but loads one asynchronously stays in the disabled state for the page lifetime.
- **P1-F — localStorage write not guarded.** `writeProgress` and `writeTrickyTokens` call `localStorage.setItem` directly. In private / quota-exhausted browsers these throw uncaught and the user sees a crash instead of an inline notice.
- **P0-B — `.env` is not auto-loaded.** `server/index.ts` and `routes/explain.ts` read `process.env.TOKENFACTORY_*` but no dotenv loader is invoked. A root `.env` is silently ignored.

## Live AI status

| Aspect | Verdict | Evidence |
|--------|---------|----------|
| Endpoint shape + validation | PASS (mock) | `tests/integration/explain-route.test.ts` — 7 cases pass against an in-process mock Token Factory. |
| Adapter error mapping | PASS (mock) | 401/403/404/429/5xx/timeout/schema-mismatch/no-key all return typed reasons. |
| Real Token Factory call | **NOT VERIFIED** | No `TOKENFACTORY_API_KEY` available in this environment; cannot make an authenticated `GET /models` or chat-completions call. Verdict per directive: `LIVE_AI_NOT_VERIFIED`. |