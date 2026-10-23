import path from "node:path";
import url from "node:url";
import express, { type Request, type Response, type NextFunction } from "express";
import { createExplainRouter } from "./routes/explain.js";
import { logger } from "./lib/logger.js";
import { loadDotenv } from "./lib/env.js";

// Load .env (repo-root, server-root, cwd) BEFORE anything else reads env.
// This keeps dev (`tsx watch`) and production (`node dist/index.js`)
// boot paths identical. Existing process.env always wins.
loadDotenv();

const PORT = Number(process.env.PORT ?? 3001);
const NODE_ENV = process.env.NODE_ENV ?? "development";

export function createApp(): express.Express {
  const app = express();

  // Tight body cap so a malicious client can't dump a huge payload at the
  // /api/ai/explain endpoint. 8 KB is more than enough for a one-sentence
  // request plus Token Factory prompt scaffolding.
  app.use(express.json({ limit: "8kb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      tokenFactoryConfigured: Boolean(process.env.TOKENFACTORY_API_KEY),
    });
  });

  app.use("/api/ai", createExplainRouter());

  // Unknown /api/* routes return a structured JSON 404, not the SPA HTML.
  app.use("/api", (_req: Request, res: Response) => {
    res.status(404).json({
      error: "not_found",
      message: "Unknown API route.",
    });
  });

  // When running in production (`npm start`), serve the built client.
  // The `NODE_ENV=production` flag is set by the npm `start` script so this
  // path activates reliably from a fresh shell without operator env setup.
  if (NODE_ENV === "production") {
    const here = path.dirname(url.fileURLToPath(import.meta.url));
    const clientDist = path.resolve(here, "../../client/dist");
    app.use(express.static(clientDist));
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    logger.error("Unhandled error", err);
    if (!res.headersSent) {
      res.status(500).json({
        error: "internal_error",
        message: "An unexpected error occurred.",
      });
    }
  });

  return app;
}

const entryHere = process.argv[1] ?? "";
const isDirect =
  entryHere.endsWith("index.ts") || entryHere.endsWith("index.js");
if (isDirect) {
  const app = createApp();
  app.listen(PORT, () => {
    logger.info(`sofer server listening on http://127.0.0.1:${PORT}`);
  });
}