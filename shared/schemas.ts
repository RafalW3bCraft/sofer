import { z } from "zod";

// ---------------------------------------------------------------------------
// Lesson content schema (static, build-time, validated against lessons.json).
// ---------------------------------------------------------------------------

export const TopicSchema = z.enum(["greetings", "numbers", "directions"]);
export type Topic = z.infer<typeof TopicSchema>;

export const PartOfSpeechSchema = z.enum([
  "noun",
  "verb",
  "adj",
  "prep",
  "pron",
  "particle",
  "interjection",
  "punct",
  "other",
]);
export type PartOfSpeech = z.infer<typeof PartOfSpeechSchema>;

export const TokenSchema = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
  arabic: z.string().min(1),
  transliteration: z.string().min(1),
  meaning: z.string().min(1),
  partOfSpeech: PartOfSpeechSchema,
  grammarNote: z.string().min(1),
});
export type Token = z.infer<typeof TokenSchema>;

export const QuestionSchema = z.object({
  prompt: z.string().min(1),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correctIndex: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  correctExplanation: z.string().min(1),
  incorrectExplanations: z.tuple([z.string(), z.string(), z.string()]),
});
export type Question = z.infer<typeof QuestionSchema>;

export const SentenceSchema = z.object({
  id: z.string().min(1),
  arabic: z.string().min(1),
  english: z.string().min(1),
  transliteration: z.string().optional(),
  tokens: z.array(TokenSchema).min(1),
  question: QuestionSchema,
});
export type Sentence = z.infer<typeof SentenceSchema>;

export const LessonSchema = z.object({
  id: z.string().min(1),
  topic: TopicSchema,
  title: z.string().min(1),
  objective: z.string().min(1),
  difficulty: z.literal("A1"),
  sentences: z.array(SentenceSchema).min(2).max(3),
});
export type Lesson = z.infer<typeof LessonSchema>;

export const LessonsFileSchema = z.object({
  version: z.literal(1),
  lessons: z.array(LessonSchema).min(1),
});
export type LessonsFile = z.infer<typeof LessonsFileSchema>;

// ---------------------------------------------------------------------------
// Alphabet content schema.
// ---------------------------------------------------------------------------

export const DiacriticSchema = z.object({
  mark: z.string().min(1),
  name: z.string().min(1),
  sound: z.string().min(1),
  example: z.string().min(1),
});
export type Diacritic = z.infer<typeof DiacriticSchema>;

export const LetterSchema = z.object({
  id: z.string().regex(/^[a-z]{2,4}$/),
  name: z.string().min(1),
  isolated: z.string().min(1),
  transliteration: z.string().min(1),
  sound: z.string().min(1),
  position: z.union([z.literal(1), z.literal(2)]).optional(),
});
export type Letter = z.infer<typeof LetterSchema>;

export const AlphabetFileSchema = z.object({
  version: z.literal(1),
  letters: z.array(LetterSchema).length(28),
  diacritics: z.array(DiacriticSchema).min(3),
});
export type AlphabetFile = z.infer<typeof AlphabetFileSchema>;

// ---------------------------------------------------------------------------
// Runtime localStorage schemas.
// ---------------------------------------------------------------------------

export const ProgressV1Schema = z.object({
  schemaVersion: z.literal(1),
  lessons: z.record(
    z.string(),
    z.object({
      completedAt: z.string().min(1),
      lastQuestionCorrect: z.boolean(),
    })
  ),
  totalQuestionsAnswered: z.number().int().nonnegative(),
  totalQuestionsCorrect: z.number().int().nonnegative(),
  lastActivityAt: z.string().min(1),
});
export type ProgressV1 = z.infer<typeof ProgressV1Schema>;

export const TrickyTokensV1Schema = z.object({
  schemaVersion: z.literal(1),
  tricky: z.record(z.string(), z.object({ markedAt: z.string().min(1) })),
});
export type TrickyTokensV1 = z.infer<typeof TrickyTokensV1Schema>;

// ---------------------------------------------------------------------------
// AI tutor request/response schemas.
// ---------------------------------------------------------------------------

export const ExplainContextSchema = z.union([
  z.literal("word"),
  z.literal("sentence"),
]);
export type ExplainContext = z.infer<typeof ExplainContextSchema>;

export const ExplainRequestSchema = z.object({
  context: ExplainContextSchema,
  arabic: z.string().min(1).max(500),
  lessonId: z.string().min(1),
  tokenIndex: z.number().int().nonnegative().optional(),
  requestId: z.string().uuid(),
});
export type ExplainRequest = z.infer<typeof ExplainRequestSchema>;

export const ExplainResponseSchema = z.object({
  explanation: z.string().min(1).max(800),
  model: z.string().min(1),
  generatedAt: z.string().min(1),
  cached: z.boolean(),
});
export type ExplainResponse = z.infer<typeof ExplainResponseSchema>;

export const ExplainErrorReasonSchema = z.enum([
  "provider_unavailable",
  "schema_mismatch",
  "rate_limited",
  "timeout",
  "invalid_request",
  "model_not_available",
]);
export type ExplainErrorReason = z.infer<typeof ExplainErrorReasonSchema>;

export const ExplainErrorSchema = z.object({
  error: z.literal("explain_failed"),
  reason: ExplainErrorReasonSchema,
  message: z.string().min(1),
});
export type ExplainError = z.infer<typeof ExplainErrorSchema>;

// ---------------------------------------------------------------------------
// Helpers used by both client and server.
// ---------------------------------------------------------------------------

export function tokenId(
  lessonId: string,
  sentenceId: string,
  tokenIndex: number
): string {
  return `${lessonId}:${sentenceId}:${tokenIndex}`;
}