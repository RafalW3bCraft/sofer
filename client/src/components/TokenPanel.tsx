import { useEffect, useRef } from "react";
import type { Sentence, Token } from "../../../shared/schemas";
import { speakArabic } from "../lib/speech";
import { useArabicSpeechStatus } from "../lib/useArabicSpeechStatus";
import AiTutorButton from "./AiTutorButton";

interface Props {
  sentence: Sentence;
  token: Token;
  isTricky: boolean;
  onToggleTricky: () => void;
  onClose: () => void;
}

export default function TokenPanel({
  token,
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
        {speechStatus.kind === "ready" ? (
          <button
            type="button"
            className="btn"
            onClick={() => speakArabic(token.arabic)}
          >
            Listen
          </button>
        ) : (
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
        )}
        <button
          type="button"
          className="btn"
          aria-pressed={isTricky}
          onClick={onToggleTricky}
        >
          {isTricky ? "Marked tricky — click to unmark" : "Mark as tricky"}
        </button>
        <AiTutorButton context="word" arabic={token.arabic} />
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </section>
  );
}