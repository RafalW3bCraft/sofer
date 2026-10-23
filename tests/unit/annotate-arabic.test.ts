/**
 * Tests for the shared annotateArabic helper used by QuestionArea, Alphabet,
 * and any other component that needs to wrap inline Arabic fragments.
 */
import { describe, expect, it } from "vitest";
import { annotateArabic } from "../../client/src/lib/annotateArabic";

describe("annotateArabic", () => {
  it("passes Latin-only text through unchanged", () => {
    expect(annotateArabic("Hello world.")).toEqual(["Hello world."]);
  });

  it("wraps a single Arabic run", () => {
    expect(annotateArabic("ٱلسَّلَامُ")).toEqual([{ arabic: "ٱلسَّلَامُ" }]);
  });

  it("splits mixed text at the Arabic boundary", () => {
    const r = annotateArabic("When would you say ٱلسَّلَامُ ?");
    expect(r).toEqual([
      "When would you say ",
      { arabic: "ٱلسَّلَامُ" },
      " ?",
    ]);
  });

  it("keeps multiple Arabic runs separate", () => {
    const r = annotateArabic("Compare ٱلسَّلَامُ and مَعَ");
    expect(r).toEqual([
      "Compare ",
      { arabic: "ٱلسَّلَامُ" },
      " and ",
      { arabic: "مَعَ" },
    ]);
  });

  it("does not match Latin or digit runs", () => {
    expect(annotateArabic("abc 123")).toEqual(["abc 123"]);
  });

  it("handles Arabic inside parentheses in a heading", () => {
    const r = annotateArabic("Short vowels (الحَرَكَات)");
    expect(r).toEqual([
      "Short vowels (",
      { arabic: "الحَرَكَات" },
      ")",
    ]);
  });
});