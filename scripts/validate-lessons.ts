import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LessonsFileSchema } from "../shared/schemas.js";

const path = resolve("client/src/content/lessons.json");
const raw = JSON.parse(readFileSync(path, "utf8"));
const result = LessonsFileSchema.safeParse(raw);
if (!result.success) {
  console.error("lessons.json failed validation:");
  console.error(result.error.format());
  process.exit(1);
}

const data = result.data;
const totalSentences = data.lessons.reduce((n, l) => n + l.sentences.length, 0);
const lessonIds = new Set<string>();
const sentenceIds = new Set<string>();
const vocabularyIds = new Set(data.vocabulary.map((item) => item.id));
const grammarIds = new Set(data.grammar.map((item) => item.id));

for (const lesson of data.lessons) {
  if (lessonIds.has(lesson.id)) {
    console.error(`Duplicate lesson id: ${lesson.id}`);
    process.exit(1);
  }
  lessonIds.add(lesson.id);
  for (const ref of lesson.prerequisites) {
    if (ref === lesson.id) {
      console.error(`Lesson ${lesson.id} cannot depend on itself.`);
      process.exit(1);
    }
  }
  for (const ref of lesson.vocabularyRefs) {
    if (!vocabularyIds.has(ref)) {
      console.error(`Unknown vocabulary reference ${ref} in ${lesson.id}.`);
      process.exit(1);
    }
  }
  for (const ref of lesson.grammarRefs) {
    if (!grammarIds.has(ref)) {
      console.error(`Unknown grammar reference ${ref} in ${lesson.id}.`);
      process.exit(1);
    }
  }
  for (const sentence of lesson.sentences) {
    if (sentenceIds.has(sentence.id)) {
      console.error(`Duplicate sentence id: ${sentence.id}`);
      process.exit(1);
    }
    sentenceIds.add(sentence.id);
    // Validate token offsets actually match the substring.
    let priorEnd = 0;
    const tokenCoverage = new Set<number>();
    for (const token of sentence.tokens) {
      const actual = sentence.arabic.slice(token.start, token.end);
      if (actual !== token.arabic) {
        console.error(
          `Token offset mismatch in ${lesson.id}/${sentence.id}: expected "${token.arabic}", got "${actual}" between ${token.start}..${token.end}`
        );
        process.exit(1);
      }
      if (token.start < 0 || token.end > sentence.arabic.length || token.start >= token.end) {
        console.error(
          `Token offset out of range in ${lesson.id}/${sentence.id}: ${token.start}..${token.end} (length ${sentence.arabic.length})`
        );
        process.exit(1);
      }
      if (token.start < priorEnd) {
        console.error(`Overlapping or unordered token offsets in ${lesson.id}/${sentence.id}.`);
        process.exit(1);
      }
      priorEnd = token.end;
      for (let offset = token.start; offset < token.end; offset += 1) tokenCoverage.add(offset);
    }
    for (let offset = 0; offset < sentence.arabic.length; offset += 1) {
      const char = sentence.arabic[offset] ?? "";
      if (!/\s/u.test(char) && !tokenCoverage.has(offset)) {
        console.error(`Unannotated text at offset ${offset} in ${lesson.id}/${sentence.id}.`);
        process.exit(1);
      }
    }
    // Validate question indices point to real options.
    if (
      sentence.question.correctIndex < 0 ||
      sentence.question.correctIndex > 3
    ) {
      console.error(
        `Question correctIndex out of range in ${lesson.id}/${sentence.id}`
      );
      process.exit(1);
    }
    if (sentence.question.options.length !== 4) {
      console.error(
        `Question options length != 4 in ${lesson.id}/${sentence.id}`
      );
      process.exit(1);
    }
  }
}

const missingPrerequisites = [...lessonIds].flatMap((id) => {
  const lesson = data.lessons.find((item) => item.id === id)!;
  return lesson.prerequisites.filter((ref) => !lessonIds.has(ref)).map((ref) => `${id} -> ${ref}`);
});
if (missingPrerequisites.length > 0) {
  console.error(`Broken lesson prerequisites: ${missingPrerequisites.join(", ")}`);
  process.exit(1);
}

console.log(
  `lessons.json OK — ${data.lessons.length} lessons, ${totalSentences} sentences, ${lessonIds.size} unique lesson ids, ${sentenceIds.size} unique sentence ids.`
);
