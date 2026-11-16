import { describe, expect, it } from "vitest";
import lessonsData from "../../client/src/content/lessons.json";
import { buildTutorContext } from "../../client/src/lib/ai/contextBuilder";
import { LessonsFileSchema } from "../../shared/schemas";

const lessons = LessonsFileSchema.parse(lessonsData).lessons;

describe("lesson-grounded tutor context", () => {
  it("selects the current sentence, selected token, and a bounded set of nearby examples", () => {
    const lesson = lessons[0]!;
    const sentence = lesson.sentences[0]!;
    const packet = buildTutorContext({ lesson, sentence, token: sentence.tokens[0] });
    expect(packet.lessonId).toBe(lesson.id);
    expect(packet.sentenceArabic).toBe(sentence.arabic);
    expect(packet.selectedMeaning).toBe(sentence.tokens[0]!.meaning);
    expect(packet.nearbyExamples.length).toBeLessThanOrEqual(3);
  });

  it("does not send draft translations or examples as trusted tutor context", () => {
    const lesson = { ...lessons[0]!, reviewStatus: "draft" as const };
    const sentence = lesson.sentences[0]!;
    const packet = buildTutorContext({ lesson, sentence, token: sentence.tokens[0] });
    expect(packet.sentenceArabic).toBeUndefined();
    expect(packet.sentenceEnglish).toBeUndefined();
    expect(packet.selectedMeaning).toBeUndefined();
    expect(packet.nearbyExamples).toEqual([]);
  });
});
