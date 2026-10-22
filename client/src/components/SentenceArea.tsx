import { useCallback } from "react";
import type { Sentence } from "../../../shared/schemas";

interface Props {
  sentence: Sentence;
  trickyTokenIds: Set<string>;
  showTranslit: boolean;
  onToggleTranslit: () => void;
  selectedTokenIndex: number | null;
  previewTokenIndex: number | null;
  onTokenActivate: (tokenIndex: number) => void;
  onTokenPreview: (tokenIndex: number) => void;
  onTokenBlur: () => void;
}

export default function SentenceArea({
  sentence,
  showTranslit,
  onToggleTranslit,
  selectedTokenIndex,
  previewTokenIndex,
  onTokenActivate,
  onTokenPreview,
  onTokenBlur,
}: Props) {
  const handleClick = useCallback(
    (tokenIndex: number) => () => onTokenActivate(tokenIndex),
    [onTokenActivate]
  );
  const handleKeyDown = useCallback(
    (tokenIndex: number) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const next = (tokenIndex + 1) % sentence.tokens.length;
        const btn = document.getElementById(
          `token-${sentence.id}-${next}`
        );
        btn?.focus();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prev =
          (tokenIndex - 1 + sentence.tokens.length) % sentence.tokens.length;
        const btn = document.getElementById(
          `token-${sentence.id}-${prev}`
        );
        btn?.focus();
      }
    },
    [sentence.id, sentence.tokens.length]
  );

  return (
    <section className="sentence-area" aria-label="Sentence">
      <p className="sentence-area__arabic" lang="ar" dir="rtl">
        {sentence.tokens.map((token, i) => (
          <button
            key={`${sentence.id}-t-${i}`}
            type="button"
            id={`token-${sentence.id}-${i}`}
            className="token"
            data-focused={selectedTokenIndex === i ? "true" : "false"}
            data-preview={previewTokenIndex === i ? "true" : "false"}
            aria-label={`${token.arabic} (${token.transliteration}): ${token.meaning}`}
            onClick={handleClick(i)}
            onFocus={() => onTokenPreview(i)}
            onBlur={onTokenBlur}
            onMouseEnter={() => onTokenPreview(i)}
            onMouseLeave={onTokenBlur}
            onKeyDown={handleKeyDown(i)}
          >
            {token.arabic}
          </button>
        ))}
      </p>
      <p className="sentence-area__english">{sentence.english}</p>
      {showTranslit && sentence.transliteration && (
        <p className="sentence-area__transliteration">
          {sentence.transliteration}
        </p>
      )}
      <div>
        <button
          type="button"
          className="btn btn--ghost"
          aria-pressed={showTranslit}
          onClick={onToggleTranslit}
        >
          {showTranslit ? "Hide transliteration" : "Show transliteration"}
        </button>
      </div>
    </section>
  );
}