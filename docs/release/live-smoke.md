# Live Token Factory smoke

**Date (UTC):** 2026-10-23 ~02:59
**Commit:** 13fe742 (HEAD at time of test)
**Tester:** Hermes (acting as autonomous operator)

## Goal

Verify the AMD Token Factory integration actually reaches a live provider when
an authorized key is present. The directive permits a live call when the
participant already has a valid authorized key. A live `TOKENFACTORY_API_KEY`
was present in the repo-root `.env` (git-ignored) at the time of testing.

## Setup

- Key present in `.env` (redacted everywhere it appears in this document):
  `v1.CmQ…VU0N`
- `.env` defaulted `TOKENFACTORY_BASE_URL` to
  `https://developer.amd.com.cn/radeon/api/v1` and `TOKENFACTORY_MODEL` to
  `DeepSeek-V4-Flash`.

## Step 1 — Default endpoint: rejected

```
smoke: baseUrl=https://developer.amd.com.cn/radeon/api/v1
smoke: model=DeepSeek-V4-Flash
smoke: GET /models -> 401
smoke: GET /models failed: {"detail":"Invalid bearer token"}
```

The China-region endpoint does not recognize the configured key.

## Step 2 — Try the documented Nebius Token Factory endpoint

```
TOKENFACTORY_BASE_URL=https://api.tokenfactory.nebius.com/v1 \
TOKENFACTORY_MODEL=Qwen/Qwen3-235B-A22B-Instruct-2507 \
npm run smoke:live
```

Output:

```
smoke: baseUrl=https://api.tokenfactory.nebius.com/v1
smoke: model=Qwen/Qwen3-235B-A22B-Instruct-2507
smoke: apiKey=v1.CmQ…VU0N
smoke: GET /models -> 200
smoke: 29 models available
smoke: first 5 = ["moonshotai/Kimi-K3","Qwen/Qwen3-235B-A22B-Instruct-2507","google/gemma-3-27b-it","Qwen/Qwen3-Embedding-8B","openai/gpt-oss-120b"]
smoke: POST chat/completions -> 200
smoke: chat content (truncated):
       As-salam is a masculine noun meaning "peace" and is commonly used as a greeting, like "peace be upon you" in full form. It is the root of the greeting "As-salamu alaykum."
smoke: PASS — live Token Factory reachable, schema valid, model "Qwen/Qwen3-235B-A22B-Instruct-2507" available.
```

## Step 3 — End-to-end via the production server

Started `npm start` with the Nebius endpoint and model injected as
environment variables; verified the full path `POST /api/ai/explain` →
adapter → live provider → schema-validated response:

```
$ curl -sS -w "\nHTTP %{http_code}\n" \
    -X POST http://127.0.0.1:3001/api/ai/explain \
    -H 'Content-Type: application/json' \
    -d '{"context":"word","arabic":"ٱلسَّلَامُ","lessonId":"greetings-1","requestId":"550e8400-e29b-41d4-a716-446655440000"}'
{"explanation":"As-salam is a noun meaning \"peace\" and is commonly used as a greeting, like \"peace be upon you\" in full form. It is a masculine noun and often appears at the beginning of greetings.","model":"Qwen/Qwen3-235B-A22B-Instruct-2507","generatedAt":"2026-10-23T02:59:28.644Z","cached":false}
HTTP 200
```

The response shape matches `ExplainResponseSchema` (`explanation`, `model`,
`generatedAt`, `cached`).

## Conclusion

**LIVE_AI_VERIFIED.** The Token Factory provider (via the documented Nebius
endpoint that the participant's key authorizes) is reachable from this
environment. The server's `/api/ai/explain` returns a real
schema-validated explanation.

## Operational notes

1. The `.env.example` shipped in the repo now documents BOTH endpoints and
   lists example model IDs for each, so a new operator doesn't have to
   rediscover which model is on which endpoint.
2. The participant's `.env` still defaults to the China endpoint and the
   `DeepSeek-V4-Flash` model. To enable the verified path, the participant
   should change `TOKENFACTORY_BASE_URL` and `TOKENFACTORY_MODEL` (the key
   is unchanged). No application code change is required — the server
   reads both at boot from `.env`.
3. The smoke script (`scripts/live-tokenfactory-smoke.ts`) is safe to run
   from any environment that has `tsx` and a key. It never logs the key
   in full, never writes anything to disk, and exits non-zero on any
   failure.
4. The directive warned that AMD documentation calls the China endpoint
   "development/trial use" and may not be globally available. That is
   confirmed by Step 1 above.

## Re-verification — 2026-10-23 ~05:57 UTC (commit 7dc424c era)

Re-ran `npm run smoke:live` after the provider-default fix:

- With the participant's `.env` defaults (which still pin the AMD China
  endpoint and `DeepSeek-V4-Flash`): `GET /models -> 401
  {"detail":"Invalid bearer token"}` — reconfirms the AMD endpoint rejects
  the Nebius key. The committed code defaults no longer point there; the
  participant should update their local `.env` (env vars win over defaults).
- With `TOKENFACTORY_BASE_URL=https://api.tokenfactory.nebius.com/v1` and
  `TOKENFACTORY_MODEL=Qwen/Qwen3-235B-A22B-Instruct-2507` (the new code
  defaults): `GET /models -> 200`, **30 models** (catalog grew by one since
  the first smoke), `POST /chat/completions -> 200`, schema-valid
  explanation returned. **PASS.**

## What was NOT verified

- **No production HTTPS URL was published.** Per the directive, deployment
  is optional. The participant may choose to publish; this repository is
  submittable as a local POC.
- **No public third-party (Nebius/AMD) uptime or SLA was tested beyond
  this single smoke run.**
- **No native-MSA linguistic review of the AI output was performed.** The
  AI explanation was inspected only for structural correctness against
  `ExplainResponseSchema`.