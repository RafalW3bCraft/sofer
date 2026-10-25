/**
 * Better Auth setup for the production-platform slice.
 * Email+password only (no OAuth providers configured), sessions via secure
 * HttpOnly cookies managed by Better Auth. Requires DATABASE_URL; when the
 * DB is absent, auth is disabled and all /api/auth + /api/me routes return
 * 503 feature_unavailable.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "../db/index.js";
import * as schema from "../db/schema.js";

// better-auth's Auth type is generic over its options; the concrete
// instance type is narrower than the declared factory return. We keep the
// instance opaque and expose only the surfaces we use (handler, api).
export type AuthInstance = ReturnType<typeof betterAuth>;

let authInstance: AuthInstance | null = null;

export function getAuth(): AuthInstance | null {
  if (authInstance) return authInstance;
  const db = getDb();
  if (!db) return null;
  // TS variance: the concrete config narrows Auth's generic parameter and
  // its plugin context is invariant in the adapter. We only use
  // option-agnostic surfaces (handler, api.getSession), so the widening
  // cast is safe and contained to this assignment.
  authInstance = betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema }),
    // Secret MUST come from the environment in any real deployment.
    secret: process.env.BETTER_AUTH_SECRET ?? undefined,
    baseURL: process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:3001",
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      // No email sending infra in the POC slice: verification is marked
      // required=false so accounts are usable immediately in dev. A real
      // deployment must wire sendVerificationEmail + requireEmailVerification.
      requireEmailVerification: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    advanced: {
      cookiePrefix: "sofer",
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        // secure is enabled automatically when baseURL is https.
      },
    },
    logger: { disabled: true },
  }) as AuthInstance;
  return authInstance;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Resolve the caller's session from the request cookie header. Returns null
 * when unauthenticated or auth is disabled. userId ALWAYS comes from the
 * verified session — never from request JSON, params, or query.
 */
export async function resolveSession(
  headers: Headers
): Promise<SessionUser | null> {
  const auth = getAuth();
  if (!auth) return null;
  const result = await auth.api.getSession({ headers });
  if (!result?.user) return null;
  return {
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
  };
}
