import type { ExplainResponse } from "../../shared/schemas.js";

export interface ExplainEnv {
  apiKey: string | null;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

const DEFAULT_BASE_URL = "https://api.tokenfactory.nebius.com/v1";
const DEFAULT_MODEL = "Qwen/Qwen3-235B-A22B-Instruct-2507";

/**
 * SSRF guard: the provider base URL is operator-configurable for
 * self-hosting / staging, but the server must never let it become an
 * arbitrary internal-network probe. Only HTTPS, only known Token Factory
 * hosts, plus http(s) loopback for local mocks in tests.
 */
const ALLOWED_HOSTS = new Set([
  "api.tokenfactory.nebius.com",
  "developer.amd.com.cn",
]);

export function resolveBaseUrl(raw: string | undefined): string | null {
  const candidate = (raw ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  const isLoopback =
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "localhost" ||
    parsed.hostname === "::1";
  if (isLoopback) {
    // Loopback is only acceptable for in-process test mocks.
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? candidate
      : null;
  }
  if (parsed.protocol !== "https:") return null;
  if (!ALLOWED_HOSTS.has(parsed.hostname)) return null;
  return candidate;
}

export function loadExplainEnv(): ExplainEnv {
  const resolved = resolveBaseUrl(process.env.TOKENFACTORY_BASE_URL);
  return {
    apiKey: process.env.TOKENFACTORY_API_KEY ?? null,
    // An operator-supplied URL outside the allowlist disables the live
    // path (treated as unconfigured) rather than being followed.
    baseUrl: resolved ?? "",
    model: process.env.TOKENFACTORY_MODEL ?? DEFAULT_MODEL,
    timeoutMs: Number(process.env.TOKENFACTORY_TIMEOUT_MS ?? 15000),
  };
}

export type ExplainOk = { ok: true; response: ExplainResponse };
export type ExplainErr = {
  ok: false;
  reason:
    | "provider_unavailable"
    | "schema_mismatch"
    | "rate_limited"
    | "timeout"
    | "invalid_request"
    | "model_not_available";
  message: string;
};
export type ExplainResult = ExplainOk | ExplainErr;

export async function callTokenFactory(
  env: ExplainEnv,
  body: {
    context: "word" | "sentence";
    arabic: string;
    lessonId: string;
    tokenIndex?: number;
    requestId: string;
  }
): Promise<ExplainResult> {
  if (!env.apiKey) {
    return {
      ok: false,
      reason: "provider_unavailable",
      message: "TOKENFACTORY_API_KEY is not configured on the server.",
    };
  }
  if (!env.baseUrl) {
    return {
      ok: false,
      reason: "provider_unavailable",
      message:
        "TOKENFACTORY_BASE_URL is not an allowed Token Factory host; refusing to call it.",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.timeoutMs);

  try {
    const url = `${env.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const systemPrompt =
      body.context === "word"
        ? "You are sofer, a calm Modern Standard Arabic tutor. Explain this Arabic word in one or two short English sentences. Be specific about meaning, part of speech, and any grammar that a beginner needs. Do not include Arabic script in the answer. Do not use markdown."
        : "You are sofer, a calm Modern Standard Arabic tutor. Explain this Arabic sentence in one or two short English sentences. Identify the core meaning, the role of any prefixes/suffixes, and any grammar a beginner needs. Do not include Arabic script in the answer. Do not use markdown.";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.apiKey}`,
      },
      body: JSON.stringify({
        model: env.model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify({
              context: body.context,
              arabic: body.arabic,
              lessonId: body.lessonId,
              tokenIndex: body.tokenIndex,
            }),
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
      signal: controller.signal,
    });

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        reason: "provider_unavailable",
        message: "Token Factory rejected the credentials.",
      };
    }
    if (res.status === 404) {
      return {
        ok: false,
        reason: "model_not_available",
        message: `Model "${env.model}" was not found at ${url}.`,
      };
    }
    if (res.status === 429) {
      return {
        ok: false,
        reason: "rate_limited",
        message: "Token Factory reported rate limiting.",
      };
    }
    if (res.status >= 500) {
      return {
        ok: false,
        reason: "provider_unavailable",
        message: `Token Factory returned ${res.status}.`,
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        reason: "provider_unavailable",
        message: `Token Factory returned ${res.status}.`,
      };
    }

    const data: unknown = await res.json();
    if (typeof data !== "object" || data === null) {
      return {
        ok: false,
        reason: "schema_mismatch",
        message: "Token Factory returned a non-object body.",
      };
    }
    const choices = (data as { choices?: unknown }).choices;
    if (!Array.isArray(choices) || choices.length === 0) {
      return {
        ok: false,
        reason: "schema_mismatch",
        message: "Token Factory response had no choices.",
      };
    }
    const first = choices[0] as { message?: { content?: unknown } } | undefined;
    const content = first?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      return {
        ok: false,
        reason: "schema_mismatch",
        message: "Token Factory response had no assistant content.",
      };
    }
    const explanation = content.length > 800 ? content.slice(0, 800) : content;
    return {
      ok: true,
      response: {
        explanation,
        model: env.model,
        generatedAt: new Date().toISOString(),
        cached: false,
      },
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        ok: false,
        reason: "timeout",
        message: `Token Factory did not respond within ${env.timeoutMs}ms.`,
      };
    }
    return {
      ok: false,
      reason: "provider_unavailable",
      message:
        err instanceof Error
          ? `Could not reach Token Factory: ${err.message}`
          : "Could not reach Token Factory.",
    };
  } finally {
    clearTimeout(timer);
  }
}