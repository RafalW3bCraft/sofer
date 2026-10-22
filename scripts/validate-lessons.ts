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

for (const lesson of data.lessons) {
  if (lessonIds.has(lesson.id)) {
    console.error(`Duplicate lesson id: ${lesson.id}`);
    process.exit(1);
  }
  lessonIds.add(lesson.id);
  for (const sentence of lesson.sentences) {
    if (sentenceIds.has(sentence.id)) {
      console.error(`Duplicate sentence id: ${sentence.id}`);
      process.exit(1);
    }
    sentenceIds.add(sentence.id);
    // Validate token offsets actually match the substring.
    const slice = sentence.arabic.slice(sentence.tokens[0]?.start ?? 0);
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

if (totalSentences !== 7) {
  console.error(
    `Expected 7 total sentences across lessons, found ${totalSentences}.`
  );
  process.exit(1);
}

console.log(
  `lessons.json OK — ${data.lessons.length} lessons, ${totalSentences} sentences, ${lessonIds.size} unique lesson ids, ${sentenceIds.size} unique sentence ids.`
);