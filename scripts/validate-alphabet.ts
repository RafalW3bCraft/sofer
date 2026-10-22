import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AlphabetFileSchema } from "../shared/schemas.js";

const path = resolve("client/src/content/alphabet.json");
const raw = JSON.parse(readFileSync(path, "utf8"));
const result = AlphabetFileSchema.safeParse(raw);
if (!result.success) {
  console.error("alphabet.json failed validation:");
  console.error(result.error.format());
  process.exit(1);
}
const ids = new Set<string>();
for (const letter of result.data.letters) {
  if (ids.has(letter.id)) {
    console.error(`Duplicate letter id: ${letter.id}`);
    process.exit(1);
  }
  ids.add(letter.id);
}
if (result.data.letters.length !== 28) {
  console.error(
    `Expected exactly 28 letters, found ${result.data.letters.length}.`
  );
  process.exit(1);
}
console.log(
  `alphabet.json OK — ${result.data.letters.length} unique letters, ${result.data.diacritics.length} diacritics.`
);