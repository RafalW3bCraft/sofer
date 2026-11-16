import { useEffect, useRef } from "react";
import type { Lesson, Sentence, Token } from "../../../shared/schemas";
import { speakArabic } from "../lib/speech";
import { useArabicSpeechStatus } from "../lib/useArabicSpeechStatus";
import AiTutorButton from "./AiTutorButton";
import { buildTutorContext } from "../lib/ai/contextBuilder";
import { readSettings } from "../lib/settings";

interface Props {
  lesson: Lesson;
  sentence: Sentence;
  token: Token;
  isTricky: boolean;
  onToggleTricky: () => void;
  onClose: () => void;
}

export default function TokenPanel({
  lesson,
  token,
  sentence,
  isTricky,
  onToggleTricky,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const speechStatus = useArabicSpeechStatus();
  const audioEnabled = readSettings().audioEnabled;

  return (
    <section
      ref={panelRef}
      className="token-panel"
      role="region"
      aria-label={`Details for ${token.arabic}`}
    >
      <div className="token-panel__row">
        <span className="token-panel__arabic" lang="ar" dir="rtl">
          {token.arabic}
        </span>
        <span className="token-panel__pos">{token.partOfSpeech}</span>
      </div>
      <p className="token-panel__translit">{token.transliteration}</p>
      <p className="token-panel__meaning">{token.meaning}</p>
      <p className="token-panel__grammar">{token.grammarNote}</p>
      <div className="token-panel__actions">
        {audioEnabled && speechStatus.kind === "ready" ? (
          <button
            type="button"
            className="btn"
            onClick={() => speakArabic(token.arabic)}
          >
            Listen
          </button>
        ) : audioEnabled ? (
          <span
            className="btn btn--ghost"
            aria-disabled="true"
            title={
              speechStatus.kind === "unsupported"
                ? "Your browser does not support speech synthesis."
                : "No Arabic voice is installed in this browser. The rest of the lesson still works."
            }
          >
            Listen (unavailable)
          </span>
        ) : null}
        <button
          type="button"
          className="btn"
          aria-pressed={isTricky}
          onClick={onToggleTricky}
        >
          {isTricky ? "Marked tricky — click to unmark" : "Mark as tricky"}
        </button>
        {lesson.reviewStatus !== "draft" && <AiTutorButton
          initialTask="explain_word"
          contextPacket={buildTutorContext({ lesson, sentence, token })}
        />}
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </section>
  );
}
