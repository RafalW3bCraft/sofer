import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AlphabetFileSchema } from "../../shared/schemas";

const alphabetPath = resolve("client/src/content/alphabet.json");
const raw = JSON.parse(readFileSync(alphabetPath, "utf8"));
const data = AlphabetFileSchema.parse(raw);

describe("alphabet.json", () => {
  it("has exactly 28 letters with unique ids", () => {
    expect(data.letters.length).toBe(28);
    const ids = new Set(data.letters.map((l) => l.id));
    expect(ids.size).toBe(28);
  });

  it("each letter has a non-empty name and isolated form", () => {
    for (const letter of data.letters) {
      expect(letter.name.length).toBeGreaterThan(0);
      expect(letter.isolated.length).toBeGreaterThan(0);
    }
  });
});