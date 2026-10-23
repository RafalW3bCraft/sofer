import { Router, type Request, type Response } from "express";
import { ExplainRequestSchema } from "../../shared/schemas.js";
import { callTokenFactory, loadExplainEnv } from "../lib/tokenfactory.js";
import { logger } from "../lib/logger.js";

// Sliding-window in-memory rate limit per IP.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;
const hits = new Map<string, number[]>();

// Periodic eviction: when a map entry has no timestamps within the
// current window, drop it so the table can't grow unboundedly across
// many distinct IPs. Runs at most once every WINDOW_MS.
let lastSweep = 0;
function sweep(): void {
  const now = Date.now();
  if (now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [ip, arr] of hits) {
    const fresh = arr.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) hits.delete(ip);
    else if (fresh.length !== arr.length) hits.set(ip, fresh);
  }
}

function rateLimit(req: Request, res: Response, next: () => void) {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: "explain_failed",
      reason: "rate_limited",
      message: "Too many explain requests. Please slow down.",
    });
    return;
  }
  arr.push(now);
  hits.set(ip, arr);
  sweep();
  next();
}

export function createExplainRouter(): Router {
  const router = Router();
  router.post("/explain", rateLimit, async (req: Request, res: Response) => {
    const parsed = ExplainRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "explain_failed",
        reason: "invalid_request",
        message: "Request body did not match the expected schema.",
      });
      return;
    }

    const env = loadExplainEnv();
    if (!env.apiKey) {
      logger.info("explain: TOKENFACTORY_API_KEY not set; returning 503");
      res.status(503).json({
        error: "explain_failed",
        reason: "provider_unavailable",
        message:
          "The AI tutor is not configured on this server. Set TOKENFACTORY_API_KEY in the server's environment to enable it.",
      });
      return;
    }

    const result = await callTokenFactory(env, parsed.data);
    if (result.ok) {
      res.json(result.response);
      return;
    }

    const status =
      result.reason === "rate_limited"
        ? 429
        : result.reason === "timeout" ||
          result.reason === "provider_unavailable" ||
          result.reason === "schema_mismatch" ||
          result.reason === "model_not_available"
        ? 503
        : 400;

    res.status(status).json({
      error: "explain_failed",
      reason: result.reason,
      message: result.message,
    });
  });
  return router;
}