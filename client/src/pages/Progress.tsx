import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import lessonsData from "../content/lessons.json";
import {
  LessonsFileSchema,
  tokenId,
} from "../../../shared/schemas";
import {
  readProgress,
  writeProgress,
  clearProgress,
  readTrickyTokens,
  writeTrickyTokens,
  emptyProgress,
  emptyTrickyTokens,
} from "../lib/storage";
import {
  accuracyPercent,
  lessonsCompletedCount,
} from "../lib/progress";

const lessonsFile = LessonsFileSchema.parse(lessonsData);

export default function Progress() {
  const initial = useMemo(() => readProgress(), []);
  const initialTricky = useMemo(() => readTrickyTokens(), []);
  const initialReason: "missing" | "corrupted" | "unsupported_version" | "ok" =
    initial.ok ? "ok" : initial.reason;
  const [progress, setProgress] = useState(() =>
    initial.ok ? initial.value : emptyProgress()
  );
  const [tricky, setTricky] = useState(() =>
    initialTricky.ok ? initialTricky.value : emptyTrickyTokens()
  );
  const [resetting, setResetting] = useState(false);

  const accuracy = accuracyPercent(progress);
  const completedCount = lessonsCompletedCount(progress);

  const handleReset = () => {
    writeProgress(emptyProgress());
    writeTrickyTokens(emptyTrickyTokens());
    setProgress(emptyProgress());
    setTricky(emptyTrickyTokens());
    clearProgress();
    setResetting(false);
  };

  const trickyList = Object.entries(tricky.tricky).map(([id, info]) => {
    const [lessonId, sentenceId, tokenIndexStr] = id.split(":");
    const lesson = lessonsFile.lessons.find((l) => l.id === lessonId);
    const sentence = lesson?.sentences.find((s) => s.id === sentenceId);
    const token = sentence?.tokens[Number(tokenIndexStr)];
    return {
      id,
      markedAt: info.markedAt,
      lesson,
      sentence,
      token,
      tokenIndex: Number(tokenIndexStr),
    };
  });

  return (
    <section className="page progress-panel">
      <h1>Your progress</h1>
      {initialReason === "corrupted" && (
        <p className="notice" role="status">
          Your saved progress was reset because it could not be read.
        </p>
      )}
      {initialReason === "ok" && initial.ok && initial.migrated && (
        <p className="notice" role="status">
          Your progress was upgraded to the new format. Completion flags were
          cleared because the previous version marked lessons complete after
          the first answer — the lesson counts you see now are accurate.
        </p>
      )}
      {progress.totalQuestionsAnswered === 0 &&
        Object.keys(progress.lessons).length === 0 && (
          <p>
            Start your first lesson to see progress here.{" "}
            <Link to="/lessons">Open the lessons.</Link>
          </p>
        )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "var(--space-3)",
        }}
      >
        <div className="progress-stat">
          <span className="progress-stat__value">{completedCount}</span>
          <span className="progress-stat__label">Lessons completed</span>
        </div>
        <div className="progress-stat">
          <span className="progress-stat__value">
            {progress.totalQuestionsAnswered}
          </span>
          <span className="progress-stat__label">Questions answered</span>
        </div>
        <div className="progress-stat">
          <span className="progress-stat__value">{accuracy}%</span>
          <span className="progress-stat__label">Accuracy</span>
        </div>
      </div>

      <h2>Tricky tokens</h2>
      {trickyList.length === 0 ? (
        <p>No tricky tokens yet. Open a lesson and mark any word you want to revisit.</p>
      ) : (
        <ul className="tricky-tokens">
          {trickyList.map((t) => (
            <li key={t.id} className="tricky-token">
              <span>
                {t.token && (
                  <span className="tricky-token__arabic" lang="ar" dir="rtl">
                    {t.token.arabic}{" "}
                  </span>
                )}
                {t.token?.transliteration && (
                  <em> ({t.token.transliteration})</em>
                )}
                {" — "}
                {t.token?.meaning}
              </span>
              {t.lesson && t.sentence && t.token && (
                <Link
                  to={`/lessons/${t.lesson.id}#${tokenId(
                    t.lesson.id,
                    t.sentence.id,
                    t.tokenIndex
                  )}`}
                  className="btn btn--ghost"
                >
                  Jump to lesson
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      <div>
        {resetting ? (
          <span style={{ display: "inline-flex", gap: "var(--space-2)" }}>
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleReset}
            >
              Confirm: reset all progress
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setResetting(false)}
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => setResetting(true)}
            disabled={progress.totalQuestionsAnswered === 0}
          >
            Reset progress
          </button>
        )}
      </div>
    </section>
  );
}