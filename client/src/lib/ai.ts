import {
  ExplainRequestSchema,
  ExplainResponseSchema,
  type ExplainRequest,
  type ExplainResponse,
} from "../../../shared/schemas";

export type AiExplainState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; response: ExplainResponse }
  | { kind: "fallback"; reason: string; message: string };

export async function explainWithAi(
  payload: ExplainRequest
): Promise<AiExplainState> {
  const parsed = ExplainRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      kind: "fallback",
      reason: "invalid_request",
      message: "Invalid request shape.",
    };
  }
  try {
    const res = await fetch("/api/ai/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const reason = (body && body.reason) || "provider_unavailable";
      const message = (body && body.message) || `Server returned ${res.status}.`;
      return { kind: "fallback", reason, message };
    }
    const body: unknown = await res.json();
    const ok = ExplainResponseSchema.safeParse(body);
    if (!ok.success) {
      return {
        kind: "fallback",
        reason: "schema_mismatch",
        message: "AI response did not match the expected schema.",
      };
    }
    return { kind: "ok", response: ok.data };
  } catch (err) {
    return {
      kind: "fallback",
      reason: "provider_unavailable",
      message:
        err instanceof Error
          ? `Could not reach the AI tutor: ${err.message}`
          : "Could not reach the AI tutor.",
    };
  }
}