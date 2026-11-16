import {
  TutorContextPacketSchema,
  type Lesson,
  type Sentence,
  type Token,
  type TutorContextPacket,
} from "../../../../shared/schemas";

export interface TutorContextInput {
  lesson: Lesson;
  sentence: Sentence;
  token?: Token;
  submittedQuestion?: string;
  recentMistakeConcepts?: string[];
  dueReviewItems?: string[];
}

/** Builds a bounded context packet from authored lesson data only. */
export function buildTutorContext(input: TutorContextInput): TutorContextPacket {
  const trusted = input.lesson.reviewStatus !== "draft";
  const nearbyExamples = trusted
    ? input.lesson.sentences
        .filter((candidate) => candidate.id !== input.sentence.id)
        .slice(0, 3)
        .map((candidate) => ({ arabic: candidate.arabic, english: candidate.english }))
    : [];

  return TutorContextPacketSchema.parse({
    lessonId: input.lesson.id,
    lessonTitle: input.lesson.title,
    learningObjective: input.lesson.objective,
    sentenceId: input.sentence.id,
    sentenceArabic: trusted ? input.sentence.arabic : undefined,
    sentenceEnglish: trusted ? input.sentence.english : undefined,
    selectedArabic: trusted ? input.token?.arabic : undefined,
    selectedMeaning: trusted ? input.token?.meaning : undefined,
    transliteration: trusted ? input.token?.transliteration : undefined,
    grammarNote: trusted ? input.token?.grammarNote : undefined,
    nearbyExamples,
    learnerLevel: "beginner",
    recentMistakeConcepts: (input.recentMistakeConcepts ?? []).slice(0, 3),
    dueReviewItems: (input.dueReviewItems ?? []).slice(0, 3),
    submittedQuestion: input.submittedQuestion?.slice(0, 500),
    quizQuestion: trusted ? input.sentence.question.prompt : undefined,
    quizOptions: trusted ? [...input.sentence.question.options] : undefined,
    correctAnswer: trusted ? input.sentence.question.options[input.sentence.question.correctIndex] : undefined,
  });
}
