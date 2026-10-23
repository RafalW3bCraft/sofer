/**
 * Find runs of Arabic Unicode characters in a string and return a sequence
 * of plain-text fragments and Arabic-marked objects. The consumer renders
 * each Arabic-marked object as a <span lang="ar" dir="rtl"> so it gets the
 * Arabic font + direction without the content author having to wrap every
 * inline fragment manually.
 *
 * Coverage: Arabic, Arabic Supplement, Arabic Extended-A, Arabic
 * Presentation Forms A + B, and the Tatweel + combining marks ranges.
 */
export type AnnotatedPart = string | { arabic: string };

const ARABIC_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g;

export function annotateArabic(text: string): AnnotatedPart[] {
  const parts: AnnotatedPart[] = [];
  let last = 0;
  for (const m of text.matchAll(ARABIC_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push(text.slice(last, idx));
    parts.push({ arabic: m[0] });
    last = idx + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}