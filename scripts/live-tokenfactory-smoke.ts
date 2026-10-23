/**
 * LIVE smoke against the Token Factory API (Nebius Token Factory by default;
 * the AMD Radeon Cloud Token Factory endpoint is a different provider that
 * does NOT accept the Nebius key). Reads credentials from the
 * repo-root .env (which is git-ignored). Never logs the key. Never writes
 * to the repo. Exit code 0 on success, 1 on failure.
 *
 * Run with: tsx scripts/live-tokenfactory-smoke.ts
 * (or `npm run smoke:live` if you want a wrapped script.)
 */
import { loadDotenv } from "../server/lib/env";

interface ModelsResponse {
  data?: Array<{ id: string }>;
}

interface ChatResponse {
  choices?: Array<{ message?: { content?: unknown } }>;
}

async function main() {
  loadDotenv();
  const apiKey = process.env.TOKENFACTORY_API_KEY ?? "";
  const baseUrl =
    process.env.TOKENFACTORY_BASE_URL ?? "https://api.tokenfactory.nebius.com/v1";
  const model = process.env.TOKENFACTORY_MODEL ?? "Qwen/Qwen3-235B-A22B-Instruct-2507";

  if (!apiKey) {
    console.error("smoke: TOKENFACTORY_API_KEY is not set; aborting.");
    process.exit(1);
  }
  console.log(`smoke: baseUrl=${baseUrl}`);
  console.log(`smoke: model=${model}`);
  // Redact the key in any future logs.
  const redacted = apiKey.slice(0, 6) + "…" + apiKey.slice(-4);
  console.log(`smoke: apiKey=${redacted}`);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);

  try {
    // 1) GET /models
    const modelsRes = await fetch(`${baseUrl.replace(/\/$/, "")}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: ctrl.signal,
    });
    console.log(`smoke: GET /models -> ${modelsRes.status}`);
    if (!modelsRes.ok) {
      const body = await modelsRes.text();
      console.error(`smoke: GET /models failed: ${body.slice(0, 200)}`);
      process.exit(1);
    }
    const models = (await modelsRes.json()) as ModelsResponse;
    const ids = (models.data ?? []).map((m) => m.id);
    console.log(`smoke: ${ids.length} models available`);
    console.log(`smoke: first 5 = ${JSON.stringify(ids.slice(0, 5))}`);
    if (!ids.includes(model)) {
      console.error(
        `smoke: configured model "${model}" not in the live model list. ` +
          `Pick one from the printed list and update TOKENFACTORY_MODEL.`
      );
      process.exit(1);
    }

    // 2) POST chat/completions with a small Arabic token request.
    const chatRes = await fetch(
      `${baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are sofer, a calm Modern Standard Arabic tutor. Explain this Arabic word in one or two short English sentences. Be specific about meaning, part of speech, and any grammar that a beginner needs. Do not include Arabic script in the answer. Do not use markdown.",
            },
            {
              role: "user",
              content: JSON.stringify({
                context: "word",
                arabic: "ٱلسَّلَامُ",
                lessonId: "greetings-1",
                tokenIndex: 0,
              }),
            },
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
        signal: ctrl.signal,
      }
    );
    console.log(`smoke: POST chat/completions -> ${chatRes.status}`);
    if (!chatRes.ok) {
      const body = await chatRes.text();
      console.error(`smoke: chat failed: ${body.slice(0, 200)}`);
      process.exit(1);
    }
    const chat = (await chatRes.json()) as ChatResponse;
    const content = chat.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      console.error("smoke: chat returned no assistant content");
      process.exit(1);
    }
    console.log(`smoke: chat content (truncated):`);
    console.log(`       ${content.slice(0, 200).replace(/\n/g, " ")}${content.length > 200 ? "…" : ""}`);
    console.log(`smoke: PASS — live Token Factory reachable, schema valid, model "${model}" available.`);
    process.exit(0);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error("smoke: timeout after 15s");
    } else {
      console.error(`smoke: ${err instanceof Error ? err.message : String(err)}`);
    }
    process.exit(1);
  } finally {
    clearTimeout(timer);
  }
}

void main();