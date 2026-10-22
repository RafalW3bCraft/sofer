import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

const lessonsFile = LessonsFileSchema.parse(lessonsData);

type Selection =
  | { kind: "none" }
  | { kind: "token"; sentenceId: string; tokenIndex: number }
  | { kind: "preview"; sentenceId: string; tokenIndex: number };

export default function LessonPlayer() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const lesson = useMemo(
    () => lessonsFile.lessons.find((l) => l.id === lessonId) ?? null,
    [lessonId]
  );

  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [selection, setSelection] = useState<Selection>({ kind: "none" });
  const [showTranslit, setShowTranslit] = useState(false);
  const [progress, setProgress] = useState(() => {
    const r = readProgress();
    return r.ok ? r.value : emptyProgress();
  });
  const [tricky, setTricky] = useState(() => {
    const r = readTrickyTokens();
    return r.ok ? r.value : emptyTrickyTokens();
  });

  useEffect(() => {
    if (!lesson) return;
    setSentenceIdx(0);
    setSelection({ kind: "none" });
  }, [lesson]);

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
      const wasCorrect = selectedIndex === sentence.question.correctIndex;
      const updated = {
        ...progress,
        lessons: {
          ...progress.lessons,
          [lesson.id]: {
            completedAt:
              progress.lessons[lesson.id]?.completedAt ??
              new Date().toISOString(),
            lastQuestionCorrect: wasCorrect,
          },
        },
        totalQuestionsAnswered: progress.totalQuestionsAnswered + 1,
        totalQuestionsCorrect:
          progress.totalQuestionsCorrect + (wasCorrect ? 1 : 0),
        lastActivityAt: new Date().toISOString(),
      };
      writeProgress(updated);
      setProgress(updated);
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
        onTokenPreview={(tokenIndex) =>
          handleTokenPreview(sentence.id, tokenIndex)
        }
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