import { z } from "zod";

// ---------------------------------------------------------------------------
// Lesson content schema (static, build-time, validated against lessons.json).
// ---------------------------------------------------------------------------

export const TopicSchema = z.enum([
  "greetings",
  "introductions",
  "family",
  "numbers",
  "time",
  "food",
  "home",
  "daily_activities",
  "directions",
  "shopping",
  "school_work",
  "travel",
  "weather",
  "health",
  "hobbies",
  "revision",
]);
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
  difficulty: z.enum(["pre_a1", "A1"]),
  reviewStatus: z.enum(["trusted", "draft"]).default("trusted"),
  prerequisites: z.array(z.string().min(1)).default([]),
  vocabularyRefs: z.array(z.string().min(1)).default([]),
  grammarRefs: z.array(z.string().min(1)).default([]),
  sentences: z.array(SentenceSchema).min(2).max(8),
});
export type Lesson = z.infer<typeof LessonSchema>;

export const VocabularyEntrySchema = z.object({
  id: z.string().min(1),
  arabic: z.string().min(1),
  transliteration: z.string().min(1),
  meaning: z.string().min(1),
  partOfSpeech: PartOfSpeechSchema,
  reviewStatus: z.enum(["trusted", "draft"]).default("trusted"),
});
export type VocabularyEntry = z.infer<typeof VocabularyEntrySchema>;

export const GrammarEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  explanation: z.string().min(1),
  reviewStatus: z.enum(["trusted", "draft"]).default("trusted"),
});
export type GrammarEntry = z.infer<typeof GrammarEntrySchema>;

export const LessonsFileSchema = z.object({
  version: z.number().int().positive(),
  packId: z.string().min(1).default("sofer-a1"),
  lessons: z.array(LessonSchema).min(1),
  vocabulary: z.array(VocabularyEntrySchema).default([]),
  grammar: z.array(GrammarEntrySchema).default([]),
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

// V2 records one entry per submitted sentence answer. The lesson
// is "completed" only when every required sentence has a recorded
// answer (correctness is independent of completion). Re-submitting
// the same sentence does NOT inflate totals.
export const AnswerRecordSchema = z.object({
  correct: z.boolean(),
  answeredAt: z.string().min(1),
});
export type AnswerRecord = z.infer<typeof AnswerRecordSchema>;

export const LessonProgressV2Schema = z.object({
  completedAt: z.string().min(1).nullable(),
  answers: z.record(z.string(), AnswerRecordSchema), // keyed by sentenceId
});
export type LessonProgressV2 = z.infer<typeof LessonProgressV2Schema>;

export const ProgressV2Schema = z.object({
  schemaVersion: z.literal(2),
  lessons: z.record(z.string(), LessonProgressV2Schema),
  totalQuestionsAnswered: z.number().int().nonnegative(),
  totalQuestionsCorrect: z.number().int().nonnegative(),
  lastActivityAt: z.string().min(1),
});
export type ProgressV2 = z.infer<typeof ProgressV2Schema>;

export const TrickyTokensV1Schema = z.object({
  schemaVersion: z.literal(1),
  // removedAt is an optional tombstone so cross-device sync can preserve an
  // explicit unmark without reviving it from an older replica.
  tricky: z.record(z.string(), z.object({ markedAt: z.string().min(1), removedAt: z.string().min(1).optional() })),
});
export type TrickyTokensV1 = z.infer<typeof TrickyTokensV1Schema>;

export const LearnerSyncStateSchema = z.object({
  schemaVersion: z.literal(1),
  progress: ProgressV2Schema,
  trickyTokens: TrickyTokensV1Schema,
  updatedAt: z.string().datetime(),
});
export type LearnerSyncState = z.infer<typeof LearnerSyncStateSchema>;

export const ReviewRecordSchema = z.object({
  tokenId: z.string().min(1).max(250),
  lastAttemptAt: z.string().datetime(),
  correct: z.boolean(),
  dueAt: z.string().datetime(),
  repetitions: z.number().int().nonnegative(),
  difficulty: z.enum(["learning", "steady"]),
});
export const ReviewStoreSchema = z.object({
  schemaVersion: z.literal(1),
  records: z.record(z.string(), ReviewRecordSchema),
});
export type ReviewRecord = z.infer<typeof ReviewRecordSchema>;
export type ReviewStore = z.infer<typeof ReviewStoreSchema>;

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
// Firebase AI Logic hybrid tutor contracts.
// ---------------------------------------------------------------------------

export const InferenceModeSchema = z.enum([
  "prefer_on_device",
  "only_on_device",
  "prefer_in_cloud",
  "only_in_cloud",
]);
export type InferenceModeValue = z.infer<typeof InferenceModeSchema>;

export const InferenceSourceSchema = z.enum([
  "on_device",
  "in_cloud",
  "unknown",
]);
export type InferenceSourceValue = z.infer<typeof InferenceSourceSchema>;

export const TutorTaskSchema = z.enum([
  "explain_word",
  "explain_sentence",
  "simplify_grammar",
  "contextual_example",
  "explain_wrong_answer",
  "practice_suggestion",
]);
export type TutorTask = z.infer<typeof TutorTaskSchema>;

export const TutorContextPacketSchema = z.object({
  lessonId: z.string().min(1).max(80),
  lessonTitle: z.string().min(1).max(160).optional(),
  learningObjective: z.string().min(1).max(500).optional(),
  sentenceId: z.string().min(1).max(80).optional(),
  sentenceArabic: z.string().max(500).optional(),
  sentenceEnglish: z.string().max(500).optional(),
  selectedArabic: z.string().max(120).optional(),
  selectedMeaning: z.string().max(300).optional(),
  transliteration: z.string().max(240).optional(),
  grammarNote: z.string().max(500).optional(),
  nearbyExamples: z.array(z.object({
    arabic: z.string().min(1).max(300),
    english: z.string().min(1).max(300),
  })).max(3).default([]),
  learnerLevel: z.enum(["beginner", "early_a1"]).default("beginner"),
  recentMistakeConcepts: z.array(z.string().min(1).max(120)).max(3).default([]),
  dueReviewItems: z.array(z.string().min(1).max(120)).max(3).default([]),
  submittedQuestion: z.string().max(500).optional(),
  quizQuestion: z.string().max(300).optional(),
  quizOptions: z.array(z.string().max(200)).max(4).optional(),
  correctAnswer: z.string().max(200).optional(),
  submittedAnswer: z.string().max(200).optional(),
});
export type TutorContextPacket = z.infer<typeof TutorContextPacketSchema>;

export const TutorRequestSchema = z.object({
  task: TutorTaskSchema,
  inferenceMode: InferenceModeSchema.default("prefer_on_device"),
  context: TutorContextPacketSchema,
  requestId: z.string().uuid(),
});
export type TutorRequest = z.infer<typeof TutorRequestSchema>;

export const TutorContentSchema = z.object({
  explanation: z.string().min(1).max(800),
  grammarNote: z.string().max(500).optional(),
  exampleArabic: z.string().max(300).optional(),
  exampleEnglish: z.string().max(300).optional(),
  practiceQuestion: z.string().max(300).optional(),
  practiceAnswer: z.string().max(300).optional(),
  confidenceOrLimitations: z.string().max(300).optional(),
  curriculumReferences: z.array(z.string().min(1).max(100)).max(5).default([]),
});
export type TutorContent = z.infer<typeof TutorContentSchema>;

export const TutorResponseSchema = TutorContentSchema.extend({
  inferenceSource: InferenceSourceSchema,
  model: z.string().min(1).max(120),
  generatedAt: z.string().datetime(),
});
export type TutorResponse = z.infer<typeof TutorResponseSchema>;

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
