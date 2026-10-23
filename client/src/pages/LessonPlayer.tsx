import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import lessonsData from "../content/lessons.json";
import {
  LessonsFileSchema,
  type Sentence,
  type Token,
  tokenId,
} from "../../../shared/schemas";
import SentenceArea from "../components/SentenceArea";
import TokenPanel from "../components/TokenPanel";
import QuestionArea from "../components/QuestionArea";
import {
  readProgress,
  writeProgress,
  readTrickyTokens,
  writeTrickyTokens,
  emptyProgress,
  emptyTrickyTokens,
  markTokenTricky,
  unmarkTokenTricky,
} from "../lib/storage";
import {
  submitAnswer as domainSubmitAnswer,
  resumeSentenceIndex,
} from "../lib/progress";
import type { ProgressV2 } from "../../../shared/schemas";

const lessonsFile = LessonsFileSchema.parse(lessonsData);

type Selection =
  | { kind: "none" }
  | { kind: "token"; sentenceId: string; tokenIndex: number }
  | { kind: "preview"; sentenceId: string; tokenIndex: number };

/**
 * Parse the location hash for a deep link of the form
 *   `#<lessonId>:<sentenceId>:<tokenIndex>`.
 * Returns null when the hash is missing or malformed.
 */
function parseDeepLinkHash(
  hash: string,
  lessonId: string
): { sentenceId: string; tokenIndex: number } | null {
  if (!hash) return null;
  const stripped = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!stripped) return null;
  const [hashLesson, sentenceId, idxStr] = stripped.split(":");
  if (hashLesson !== lessonId || !sentenceId || idxStr === undefined) return null;
  const idx = Number.parseInt(idxStr, 10);
  if (!Number.isInteger(idx) || idx < 0) return null;
  return { sentenceId, tokenIndex: idx };
}

export default function LessonPlayer() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const lesson = useMemo(
    () => lessonsFile.lessons.find((l) => l.id === lessonId) ?? null,
    [lessonId]
  );

  const [progress, setProgress] = useState<ProgressV2>(() => {
    const r = readProgress();
    return r.ok ? r.value : emptyProgress();
  });
  const [tricky, setTricky] = useState(() => {
    const r = readTrickyTokens();
    return r.ok ? r.value : emptyTrickyTokens();
  });
  const [selection, setSelection] = useState<Selection>({ kind: "none" });
  const [showTranslit, setShowTranslit] = useState(false);
  const [lessonJustCompleted, setLessonJustCompleted] = useState(false);

  // The current sentence index is INITIALIZED from stored progress (resume)
  // and then lives in component state until the user advances.
  const [sentenceIdx, setSentenceIdx] = useState<number>(() => {
    if (!lesson) return 0;
    const deepLink = parseDeepLinkHash(location.hash, lesson.id);
    if (deepLink) {
      const idx = lesson.sentences.findIndex((s) => s.id === deepLink.sentenceId);
      if (idx >= 0) return idx;
    }
    const ids = lesson.sentences.map((s) => s.id);
    return resumeSentenceIndex(progress, lesson.id, ids);
  });

  // When the lesson id in the URL changes, reset the cursor to the
  // resume point for the new lesson. We deliberately do NOT depend on
  // `progress` here — once the user advances within a lesson, their
  // position is their own, and progress changes must not yank them back.
  useEffect(() => {
    if (!lesson) return;
    applyLocationState();
    // Some browsers don't fire `hashchange` when React Router DOM v6
    // navigates within the same route via SPA history push. Watch the
    // location object via a tick as a fallback.
    const onHashChange = () => applyLocationState();
    window.addEventListener("hashchange", onHashChange);
    // Re-apply on the next animation frame too — covers the case where
    // the hash was already on the URL when the component mounted and the
    // browser hasn't fired hashchange yet.
    const raf = window.requestAnimationFrame(applyLocationState);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id, location.pathname]);

  function applyLocationState() {
    if (!lesson) return;
    const deepLink = parseDeepLinkHash(location.hash, lesson.id);
    if (deepLink) {
      const idx = lesson.sentences.findIndex((s) => s.id === deepLink.sentenceId);
      if (idx >= 0) {
        setSentenceIdx(idx);
        setSelection({ kind: "token", sentenceId: deepLink.sentenceId, tokenIndex: deepLink.tokenIndex });
        setLessonJustCompleted(false);
        return;
      }
    }
    const ids = lesson.sentences.map((s) => s.id);
    setSentenceIdx(resumeSentenceIndex(progress, lesson.id, ids));
    setSelection({ kind: "none" });
    setLessonJustCompleted(false);
  }

  const sentence: Sentence | null = lesson
    ? lesson.sentences[sentenceIdx] ?? null
    : null;

  const currentToken: Token | null = useMemo(() => {
    if (!sentence) return null;
    if (selection.kind === "none") return null;
    return sentence.tokens[selection.tokenIndex] ?? null;
  }, [sentence, selection]);

  const handleTokenActivate = useCallback(
    (sentenceId: string, tokenIndex: number) => {
      setSelection({ kind: "token", sentenceId, tokenIndex });
    },
    []
  );

  const handleTokenPreview = useCallback(
    (sentenceId: string, tokenIndex: number) => {
      setSelection({ kind: "preview", sentenceId, tokenIndex });
    },
    []
  );

  const handleClosePanel = useCallback(() => {
    setSelection({ kind: "none" });
  }, []);

  const handleAnswer = useCallback(
    (selectedIndex: number) => {
      if (!lesson || !sentence) return;
      const correct = selectedIndex === sentence.question.correctIndex;
      const requiredSentenceIds = lesson.sentences.map((s) => s.id);
      const { next, lessonJustCompleted: justDone } = domainSubmitAnswer(
        progress,
        {
          lessonId: lesson.id,
          sentenceId: sentence.id,
          correct,
          requiredSentenceIds,
        }
      );
      writeProgress(next);
      setProgress(next);
      setLessonJustCompleted(justDone);
    },
    [lesson, sentence, progress]
  );

  const handleAdvance = useCallback(() => {
    if (!lesson) return;
    if (sentenceIdx + 1 < lesson.sentences.length) {
      setSentenceIdx((i) => i + 1);
      setSelection({ kind: "none" });
    } else {
      navigate("/lessons");
    }
  }, [lesson, sentenceIdx, navigate]);

  const handleToggleTricky = useCallback(
    (sentenceId: string, tokenIndex: number) => {
      if (!lesson) return;
      const id = tokenId(lesson.id, sentenceId, tokenIndex);
      const updated = tricky.tricky[id]
        ? unmarkTokenTricky(tricky, id)
        : markTokenTricky(tricky, id);
      writeTrickyTokens(updated);
      setTricky(updated);
    },
    [lesson, tricky]
  );

  if (!lesson) {
    return (
      <section className="page">
        <h1>Lesson not found</h1>
        <p>
          <Link to="/lessons" className="btn">Back to lessons</Link>
        </p>
      </section>
    );
  }

  if (!sentence) {
    return (
      <section className="page">
        <h1>This lesson has no sentences</h1>
      </section>
    );
  }

  return (
    <section className="page lesson-player">
      <p>
        <Link to="/lessons" className="btn btn--ghost">← Back to lessons</Link>
      </p>
      <header>
        <h1>{lesson.title}</h1>
        <p style={{ color: "var(--color-text-soft)" }}>{lesson.objective}</p>
        <p>
          Sentence {sentenceIdx + 1} of {lesson.sentences.length}
          {lessonJustCompleted && " · ✓ Lesson complete"}
        </p>
        <p className="lesson-hint">
          Tap any Arabic word below to see its meaning and grammar — then answer
          the question to continue.
        </p>
      </header>

      <SentenceArea
        sentence={sentence}
        trickyTokenIds={new Set(
          Object.keys(tricky.tricky).filter((id) => id.startsWith(`${lesson.id}:${sentence.id}:`))
        )}
        showTranslit={showTranslit}
        onToggleTranslit={() => setShowTranslit((v) => !v)}
        selectedTokenIndex={
          selection.kind !== "none" ? selection.tokenIndex : null
        }
        previewTokenIndex={
          selection.kind === "preview" ? selection.tokenIndex : null
        }
        onTokenActivate={(tokenIndex) =>
          handleTokenActivate(sentence.id, tokenIndex)
        }
        onTokenPreview={(tokenIndex) => {
          // Don't downgrade an active panel selection to a transient
          // preview (this matters for deep-link opens).
          if (selection.kind === "token") return;
          handleTokenPreview(sentence.id, tokenIndex);
        }}
        onTokenBlur={() => {
          if (selection.kind === "preview") setSelection({ kind: "none" });
        }}
      />

      {selection.kind === "token" && currentToken && (
        <TokenPanel
          sentence={sentence}
          token={currentToken}
          isTricky={Boolean(
            tricky.tricky[tokenId(lesson.id, sentence.id, currentTokenIndex(selection))]
          )}
          onToggleTricky={() =>
            handleToggleTricky(sentence.id, currentTokenIndex(selection))
          }
          onClose={handleClosePanel}
        />
      )}

      {selection.kind === "preview" && sentence.tokens[selection.tokenIndex] && (
        <p className="token-preview" role="status">
          {sentence.tokens[selection.tokenIndex]?.meaning}
        </p>
      )}

      <QuestionArea
        question={sentence.question}
        onSubmit={handleAnswer}
        onAdvance={handleAdvance}
        isLast={sentenceIdx + 1 === lesson.sentences.length}
      />
    </section>
  );
}

function currentTokenIndex(s: Selection): number {
  return s.kind === "none" ? -1 : s.tokenIndex;
}