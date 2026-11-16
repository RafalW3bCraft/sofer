import path from "node:path";
import url from "node:url";
import express, { type Request, type Response, type NextFunction } from "express";
import { createDictionaryRouter } from "./routes/dictionary.js";
import { getDb } from "./db/index.js";
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

  // Keep JSON request bodies small for the remaining dictionary/API routes.
  app.use(express.json({ limit: "8kb" }));

  // Baseline security headers for every response. The SPA is self-contained
  // (bundled assets, no inline scripts, no third-party origins besides the
  // same-origin API), so a restrictive CSP is safe.
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://firebasevertexai.googleapis.com https://generativelanguage.googleapis.com https://firebaseappcheck.googleapis.com https://firebaseinstallations.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://www.google.com https://recaptchaenterprise.googleapis.com; frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
    );
    next();
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      ok: true,
    });
  });

  // Firebase Auth and Firestore are the active account/progress system.
  // Keep the public, non-personal dictionary API available when PostgreSQL
  // is configured, without mounting the legacy Better Auth account routes.
  if (getDb()) {
    app.use("/api/dictionary", createDictionaryRouter());
  }

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
