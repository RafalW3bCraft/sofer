import { useMemo } from "react";
import { Link } from "react-router-dom";
import lessonsData from "../content/lessons.json";
import { LessonsFileSchema } from "../../../shared/schemas";
import { readProgress } from "../lib/storage";
import { lessonsCompletedCount, resumeSentenceIndex } from "../lib/progress";

const lessonsFile = LessonsFileSchema.parse(lessonsData);

export default function LessonList() {
  const initial = useMemo(() => readProgress(), []);
  const progress = initial.ok ? initial.value : null;
  const completed = progress ? progress.lessons : {};
  const firstUncompleted = useMemo(() => {
    for (const lesson of lessonsFile.lessons) {
      const ids = lesson.sentences.map((s) => s.id);
      // A lesson is done only when every sentence has been answered.
      const next = progress
        ? resumeSentenceIndex(progress, lesson.id, ids)
        : 0;
      const isDone = next >= ids.length && ids.length > 0;
      if (!isDone) return lesson.id;
    }
    return null;
  }, [progress]);
  const completedCount = progress ? lessonsCompletedCount(progress) : 0;

  return (
    <section className="page">
      <h1>Lessons</h1>
      <p style={{ color: "var(--color-text-soft)" }}>
        {completedCount} of {lessonsFile.lessons.length} lessons complete.
      </p>
      {firstUncompleted && (
        <p>
          <Link to={`/lessons/${firstUncompleted}`} className="btn btn--primary">
            Continue where you left off
          </Link>
        </p>
      )}
      <ul className="lesson-list" aria-label="Available lessons">
        {lessonsFile.lessons.map((lesson) => {
          const done = Boolean(completed[lesson.id]);
          return (
            <li key={lesson.id}>
              <Link to={`/lessons/${lesson.id}`} className="lesson-list__item">
                <span>
                  <span className="lesson-list__title">{lesson.title}</span>
                  <br />
                  <span className="lesson-list__topic">
                    {lesson.topic} · {lesson.sentences.length} sentence
                    {lesson.sentences.length === 1 ? "" : "s"}
                  </span>
                </span>
                <span aria-hidden="true">
                  {done ? (
                    <span className="lesson-list__check" aria-label="Completed">
                      ✓ done
                    </span>
                  ) : (
                    <span>{done ? "Review" : "Start"}</span>
                  )}
                </span>
                <span className="visually-hidden">
                  {done ? "Completed. Click to review." : "Not yet started."}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}