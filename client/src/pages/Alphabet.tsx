import alphabetData from "../content/alphabet.json";
import { AlphabetFileSchema } from "../../../shared/schemas";
import { useArabicSpeechStatus } from "../lib/useArabicSpeechStatus";
import { speakArabic } from "../lib/speech";
import { annotateArabic } from "../lib/annotateArabic";

const alphabet = AlphabetFileSchema.parse(alphabetData);

export default function Alphabet() {
  const speechStatus = useArabicSpeechStatus();
  return (
    <section className="page">
      <h1>The Arabic alphabet</h1>
      <p>
        The Arabic script has 28 letters. Each one is shown below in its
        isolated form, with a name and a short sound description.
      </p>
      <ul className="alphabet-grid" aria-label="Arabic letters">
        {alphabet.letters.map((letter) => (
          <li key={letter.id} className="alphabet-cell">
            <span className="alphabet-cell__glyph" lang="ar" dir="rtl">
              {letter.isolated}
            </span>
            <span className="alphabet-cell__name">{letter.name}</span>
            <small style={{ color: "var(--color-text-soft)" }}>
              {letter.transliteration}
            </small>
            {speechStatus.kind === "ready" ? (
              <button
                type="button"
                className="btn btn--ghost"
                style={{ minHeight: "32px", padding: "4px 8px", fontSize: "0.85rem" }}
                onClick={() => speakArabic(letter.name)}
              >
                Listen
              </button>
            ) : (
              <span
                style={{ fontSize: "0.75rem", color: "var(--color-text-soft)" }}
                title="No Arabic voice installed"
              >
                no audio
              </span>
            )}
          </li>
        ))}
      </ul>
      <h2>
        {annotateArabic("Short vowels (الحَرَكَات)").map((part, i) =>
          typeof part === "string" ? (
            <span key={i}>{part}</span>
          ) : (
            <span key={i} lang="ar" dir="rtl">
              {part.arabic}
            </span>
          )
        )}
      </h2>
      <p>
        Arabic normally writes only consonants. Three small marks above and below
        the letters show the short vowels you would pronounce.
      </p>
      <ul className="lesson-list">
        {alphabet.diacritics.map((d) => (
          <li key={d.mark} className="lesson-list__item">
            <span>
              <span lang="ar" dir="rtl" style={{ fontFamily: "var(--font-arabic)", fontSize: "1.5rem", marginRight: "var(--space-2)" }}>
                {d.mark}
              </span>
              <strong>{d.name}</strong> — {d.sound}
            </span>
            <span className="lesson-list__topic" dir="rtl" lang="ar">
              {d.example}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}