/**
 * Authenticated account routes for the production-platform slice.
 *
 * Authorization model: userId is derived ONLY from the verified session
 * cookie. Request JSON/params/query can never select another user. Every
 * handler returns a stable error shape { error, reason, message } and never
 * leaks internal details.
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "../db/index.js";
import * as schema from "../db/schema.js";
import { resolveSession, type SessionUser } from "../lib/auth.js";

const PrefsPatchSchema = z.object({
  showTranslit: z.boolean().optional(),
  speechRate: z.number().int().min(50).max(200).optional(),
});

const AttemptSchema = z.object({
  lessonId: z.string().min(1).max(64),
  sentenceId: z.string().min(1).max(64),
  correct: z.boolean(),
  idempotencyKey: z.string().min(8).max(128),
});

const TrickyPutSchema = z.object({
  tokenId: z
    .string()
    .regex(/^[^:]{1,64}:[^:]{1,64}:[0-9]{1,4}$/, "tokenId must be <lessonId>:<sentenceId>:<index>"),
});

const ReviewSchema = z.object({
  tokenId: z
    .string()
    .regex(/^[^:]{1,64}:[^:]{1,64}:[0-9]{1,4}$/, "tokenId must be <lessonId>:<sentenceId>:<index>"),
  correct: z.boolean(),
});

const ImportSchema = z.object({
  attempts: z
    .array(
      z.object({
        lessonId: z.string().min(1).max(64),
        sentenceId: z.string().min(1).max(64),
        correct: z.boolean(),
        answeredAt: z.string().min(1).max(40),
      })
    )
    .max(500),
  trickyTokens: z.array(z.string().max(200)).max(1000).default([]),
  confirm: z.literal(true),
});

function err(res: Response, status: number, reason: string, message: string) {
  res.status(status).json({ error: "me_failed", reason, message });
}

/** Middleware: require auth-enabled server + verified session. */
async function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!getDb()) {
    err(res, 503, "feature_unavailable", "Account sync is not configured on this server.");
    return;
  }
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === "string") headers.set(k, v);
    else if (Array.isArray(v)) headers.set(k, v.join(", "));
  }
  const user = await resolveSession(headers);
  if (!user) {
    err(res, 401, "unauthenticated", "Sign in to use account sync.");
    return;
  }
  (req as Request & { user: SessionUser }).user = user;
  next();
}

export function createMeRouter(): Router {
  const router = Router();
  router.use(requireUser);

  router.get("/", (req: Request, res: Response) => {
    const user = (req as Request & { user: SessionUser }).user;
    res.json({ id: user.id, email: user.email, name: user.name });
  });

  // ---- preferences ----
  router.get("/preferences", async (req: Request, res: Response) => {
    const db = getDb()!;
    const user = (req as Request & { user: SessionUser }).user;
    const rows = await db
      .select()
      .from(schema.userPreferences)
      .where(eq(schema.userPreferences.userId, user.id))
      .limit(1);
    res.json(
      rows[0] ?? { showTranslit: false, speechRate: 100 }
    );
  });

  router.patch("/preferences", async (req: Request, res: Response) => {
    const parsed = PrefsPatchSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, "invalid_request", "Preferences did not match the expected shape.");
    const db = getDb()!;
    const user = (req as Request & { user: SessionUser }).user;
    const current = await db
      .select()
      .from(schema.userPreferences)
      .where(eq(schema.userPreferences.userId, user.id))
      .limit(1);
    const next = {
      showTranslit: parsed.data.showTranslit ?? current[0]?.showTranslit ?? false,
      speechRate: parsed.data.speechRate ?? current[0]?.speechRate ?? 100,
      updatedAt: new Date(),
    };
    await db
      .insert(schema.userPreferences)
      .values({ userId: user.id, ...next })
      .onConflictDoUpdate({
        target: schema.userPreferences.userId,
        set: next,
      });
    res.json({ showTranslit: next.showTranslit, speechRate: next.speechRate });
  });

  // ---- attempts (idempotent) ----
  router.post("/attempts", async (req: Request, res: Response) => {
    const parsed = AttemptSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, "invalid_request", "Attempt did not match the expected shape.");
    const db = getDb()!;
    const user = (req as Request & { user: SessionUser }).user;
    const { lessonId, sentenceId, correct, idempotencyKey } = parsed.data;
    const inserted = await db
      .insert(schema.lessonAttempts)
      .values({
        id: randomUUID(),
        userId: user.id,
        lessonId,
        sentenceId,
        correct,
        idempotencyKey,
      })
      .onConflictDoNothing({
        target: [schema.lessonAttempts.userId, schema.lessonAttempts.idempotencyKey],
      })
      .returning({ id: schema.lessonAttempts.id });
    res.status(inserted.length > 0 ? 201 : 200).json({
      recorded: inserted.length > 0,
      duplicate: inserted.length === 0,
    });
  });

  router.get("/attempts", async (req: Request, res: Response) => {
    const db = getDb()!;
    const user = (req as Request & { user: SessionUser }).user;
    const rows = await db
      .select({
        lessonId: schema.lessonAttempts.lessonId,
        sentenceId: schema.lessonAttempts.sentenceId,
        correct: schema.lessonAttempts.correct,
        answeredAt: schema.lessonAttempts.answeredAt,
      })
      .from(schema.lessonAttempts)
      .where(eq(schema.lessonAttempts.userId, user.id))
      .orderBy(schema.lessonAttempts.answeredAt)
      .limit(1000);
    res.json({ attempts: rows });
  });

  // ---- progress ----
  router.get("/progress", async (req: Request, res: Response) => {
    const db = getDb()!;
    const user = (req as Request & { user: SessionUser }).user;
    const rows = await db
      .select()
      .from(schema.lessonProgress)
      .where(eq(schema.lessonProgress.userId, user.id));
    const attempts = await db
      .select({
        lessonId: schema.lessonAttempts.lessonId,
        total: sql<number>`count(*)::int`,
        correct: sql<number>`count(*) filter (where ${schema.lessonAttempts.correct})::int`,
      })
      .from(schema.lessonAttempts)
      .where(eq(schema.lessonAttempts.userId, user.id))
      .groupBy(schema.lessonAttempts.lessonId);
    res.json({
      lessons: rows.map((r) => ({
        lessonId: r.lessonId,
        completedAt: r.completedAt,
      })),
      attemptsByLesson: attempts,
    });
  });

  // ---- tricky tokens ----
  router.get("/tricky-tokens", async (req: Request, res: Response) => {
    const db = getDb()!;
    const user = (req as Request & { user: SessionUser }).user;
    const rows = await db
      .select({ tokenId: schema.trickyTokens.tokenId, markedAt: schema.trickyTokens.markedAt })
      .from(schema.trickyTokens)
      .where(eq(schema.trickyTokens.userId, user.id))
      .limit(1000);
    res.json({ trickyTokens: rows });
  });

  router.put("/tricky-tokens", async (req: Request, res: Response) => {
    const parsed = TrickyPutSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, "invalid_request", "tokenId did not match the expected shape.");
    const db = getDb()!;
    const user = (req as Request & { user: SessionUser }).user;
    await db
      .insert(schema.trickyTokens)
      .values({ id: randomUUID(), userId: user.id, tokenId: parsed.data.tokenId })
      .onConflictDoNothing({
        target: [schema.trickyTokens.userId, schema.trickyTokens.tokenId],
      });
    res.status(201).json({ marked: true });
  });

  router.delete("/tricky-tokens/:tokenId", async (req: Request, res: Response) => {
    const tokenId = decodeURIComponent(String(req.params.tokenId ?? ""));
    const parsed = TrickyPutSchema.safeParse({ tokenId });
    if (!parsed.success) return err(res, 400, "invalid_request", "tokenId did not match the expected shape.");
    const db = getDb()!;
    const user = (req as Request & { user: SessionUser }).user;
    await db
      .delete(schema.trickyTokens)
      .where(
        and(
          eq(schema.trickyTokens.userId, user.id),
          eq(schema.trickyTokens.tokenId, tokenId)
        )
      );
    res.json({ marked: false });
  });

  // ---- review events + queue ----
  router.post("/reviews", async (req: Request, res: Response) => {
    const parsed = ReviewSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, "invalid_request", "Review did not match the expected shape.");
    const db = getDb()!;
    const user = (req as Request & { user: SessionUser }).user;
    await db.insert(schema.reviewEvents).values({
      id: randomUUID(),
      userId: user.id,
      tokenId: parsed.data.tokenId,
      correct: parsed.data.correct,
    });
    res.status(201).json({ recorded: true });
  });

  /**
   * Deterministic review queue: tricky tokens ordered by least-recent
   * successful review first; never-reviewed tokens first. No ML, no fake
   * proficiency score.
   */
  router.get("/reviews/queue", async (req: Request, res: Response) => {
    const db = getDb()!;
    const user = (req as Request & { user: SessionUser }).user;
    const rows = await db
      .select({
        tokenId: schema.trickyTokens.tokenId,
        markedAt: schema.trickyTokens.markedAt,
        lastReviewedAt: sql<string | null>`(
          select max(${schema.reviewEvents.reviewedAt})
          from ${schema.reviewEvents}
          where ${schema.reviewEvents.userId} = ${user.id}
            and ${schema.reviewEvents.tokenId} = ${schema.trickyTokens.tokenId}
        )`,
      })
      .from(schema.trickyTokens)
      .where(eq(schema.trickyTokens.userId, user.id))
      .orderBy(
        sql`coalesce((
          select max(${schema.reviewEvents.reviewedAt})
          from ${schema.reviewEvents}
          where ${schema.reviewEvents.userId} = ${user.id}
            and ${schema.reviewEvents.tokenId} = ${schema.trickyTokens.tokenId}
        ), 'epoch'::timestamptz) asc`
      )
      .limit(100);
    res.json({ queue: rows });
  });

  // ---- first-login import of guest progress (explicit, confirmed) ----
  router.post("/import-local", async (req: Request, res: Response) => {
    const parsed = ImportSchema.safeParse(req.body);
    if (!parsed.success) {
      return err(
        res,
        400,
        "invalid_request",
        "Import payload invalid or missing confirm:true. Import is never automatic."
      );
    }
    const db = getDb()!;
    const user = (req as Request & { user: SessionUser }).user;
    let importedAttempts = 0;
    await db.transaction(async (tx) => {
      for (const a of parsed.data.attempts) {
        // Deterministic idempotency key from content so re-importing the
        // same guest data is a no-op (at-least-once safe).
        const key = `import:${a.lessonId}:${a.sentenceId}:${a.answeredAt}`;
        const ins = await tx
          .insert(schema.lessonAttempts)
          .values({
            id: randomUUID(),
            userId: user.id,
            lessonId: a.lessonId,
            sentenceId: a.sentenceId,
            correct: a.correct,
            idempotencyKey: key,
          })
          .onConflictDoNothing({
            target: [schema.lessonAttempts.userId, schema.lessonAttempts.idempotencyKey],
          })
          .returning({ id: schema.lessonAttempts.id });
        importedAttempts += ins.length;
      }
      for (const tokenId of parsed.data.trickyTokens) {
        if (!/^[^:]{1,64}:[^:]{1,64}:[0-9]{1,4}$/.test(tokenId)) continue;
        await tx
          .insert(schema.trickyTokens)
          .values({ id: randomUUID(), userId: user.id, tokenId })
          .onConflictDoNothing({
            target: [schema.trickyTokens.userId, schema.trickyTokens.tokenId],
          });
      }
      await tx.insert(schema.auditEvents).values({
        id: randomUUID(),
        userId: user.id,
        action: "progress.imported",
      });
    });
    res.json({ importedAttempts, trickyTokens: parsed.data.trickyTokens.length });
  });

  // ---- account deletion: actually removes rows ----
  router.delete("/", async (req: Request, res: Response) => {
    const db = getDb()!;
    const user = (req as Request & { user: SessionUser }).user;
    await db.transaction(async (tx) => {
      await tx.insert(schema.auditEvents).values({
        id: randomUUID(),
        userId: user.id,
        action: "account.deleted",
      });
      // user row cascades to session/account/preferences/attempts/progress/
      // tricky/review tables via onDelete: cascade.
      await tx.delete(schema.user).where(eq(schema.user.id, user.id));
    });
    res.json({ deleted: true });
  });

  return router;
}
