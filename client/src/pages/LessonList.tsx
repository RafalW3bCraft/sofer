import { useMemo } from "react";
import { Link } from "react-router-dom";
import lessonsData from "../content/lessons.json";
import { LessonsFileSchema } from "../../../shared/schemas";
import { readProgress } from "../lib/storage";

const lessonsFile = LessonsFileSchema.parse(lessonsData);

export default function LessonList() {
  const progress = useMemo(() => readProgress(), []);
  const completed = progress.ok ? progress.value.lessons : {};
  const firstUncompleted = useMemo(() => {
    for (const lesson of lessonsFile.lessons) {
      if (!completed[lesson.id]) return lesson.id;
    }
    return null;
  }, [completed]);

  return (
    <section className="page">
      <h1>Lessons</h1>
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