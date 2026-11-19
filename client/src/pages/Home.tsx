import { useMemo } from "react";
import { Link } from "react-router-dom";
import lessonsData from "../content/lessons.json";
import { LessonsFileSchema } from "../../../shared/schemas";
import { readProgress, readTrickyTokens } from "../lib/storage";
import { resumeSentenceIndex } from "../lib/progress";

const lessonsFile = LessonsFileSchema.parse(lessonsData);
const trustedLessons = lessonsFile.lessons.filter(
  (lesson) => lesson.reviewStatus !== "draft",
);
const openingSentence = trustedLessons[0]?.sentences[0];

export default function Home() {
  const progressRead = useMemo(() => readProgress(), []);
  const progress = progressRead.ok ? progressRead.value : null;
  const trickyRead = useMemo(() => readTrickyTokens(), []);
  const reviewCount = trickyRead.ok
    ? Object.values(trickyRead.value.tricky).filter((item) => !item.removedAt).length
    : 0;
  const completedCount = progress
    ? trustedLessons.filter((lesson) => {
        const sentenceIds = lesson.sentences.map((sentence) => sentence.id);
        return sentenceIds.length > 0 && resumeSentenceIndex(progress, lesson.id, sentenceIds) >= sentenceIds.length;
      }).length
    : 0;
  const nextLesson = trustedLessons.find((lesson) => {
    const sentenceIds = lesson.sentences.map((sentence) => sentence.id);
    return !progress || resumeSentenceIndex(progress, lesson.id, sentenceIds) < sentenceIds.length;
  });
  const nextPath = nextLesson ? `/lessons/${nextLesson.id}` : "/lessons";
  const continueLabel = completedCount > 0 ? "Continue learning" : "Start your first lesson";

  return (
    <section className="page home-page" aria-labelledby="home-title">
      <div className="home-hero">
        <div className="home-hero__copy">
          <p className="eyebrow"><span className="eyebrow__dot" /> Arabic · A1 foundations</p>
          <h1 id="home-title">A new language,<br />one sentence at a time.</h1>
          <p className="home-hero__intro">
            Build your reading confidence with clear, contextual lessons in Modern Standard Arabic.
            Open a word to see how it works in the sentence.
          </p>
          <div className="home-hero__actions">
            <Link to={nextPath} className="btn btn--primary home-primary-action">
              {continueLabel}<span aria-hidden="true">→</span>
            </Link>
            <Link to="/lessons" className="home-text-link">Explore lessons</Link>
          </div>
          <p className="home-hero__note">No account needed · Your progress stays on this device</p>
        </div>

        {openingSentence && (
          <aside className="reading-card" aria-label="A first phrase in Arabic">
            <div className="reading-card__topline">
              <span>FIRST PHRASE</span>
              <span className="reading-card__number">01</span>
            </div>
            <p className="reading-card__arabic" lang="ar" dir="rtl">{openingSentence.arabic}</p>
            <div className="reading-card__rule" />
            <p className="reading-card__translation">{openingSentence.english}</p>
            {openingSentence.transliteration && (
              <p className="reading-card__transliteration">{openingSentence.transliteration}</p>
            )}
            <span className="reading-card__caption">A greeting · Lesson 1</span>
          </aside>
        )}
      </div>

      <section className="home-progress" aria-labelledby="home-progress-title">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">YOUR LEARNING</p>
            <h2 id="home-progress-title">A steady start</h2>
          </div>
          <Link to="/progress" className="home-text-link">View progress <span aria-hidden="true">→</span></Link>
        </div>
        <div className="home-stat-grid">
          <div className="home-stat">
            <span className="home-stat__value">{completedCount}<span>/{trustedLessons.length}</span></span>
            <span className="home-stat__label">Lessons completed</span>
          </div>
          <div className="home-stat">
            <span className="home-stat__value">{progress?.totalQuestionsAnswered ?? 0}</span>
            <span className="home-stat__label">Questions answered</span>
          </div>
          <div className="home-stat home-stat--last">
            <span className="home-stat__value">{reviewCount}</span>
            <span className="home-stat__label">Words to revisit</span>
          </div>
          <Link to={reviewCount > 0 ? "/review" : "/practice"} className="home-review-link">
            <span className="home-review-link__icon" aria-hidden="true">↗</span>
            <span><strong>{reviewCount > 0 ? "Review a word" : "Try a quick practice"}</strong><small>{reviewCount > 0 ? "Pick up where you left off" : "Keep new words fresh"}</small></span>
          </Link>
        </div>
      </section>

      <section className="home-paths" aria-label="Explore learning tools">
        <Link to="/alphabet" className="home-path">
          <span className="home-path__symbol" lang="ar" dir="rtl" aria-hidden="true">أ ب</span>
          <span><strong>Letters & sounds</strong><small>Get familiar with the Arabic alphabet</small></span>
          <span className="home-path__arrow" aria-hidden="true">→</span>
        </Link>
        <Link to="/practice" className="home-path">
          <span className="home-path__symbol home-path__symbol--practice" aria-hidden="true">✓</span>
          <span><strong>Practice</strong><small>Recall words and check your understanding</small></span>
          <span className="home-path__arrow" aria-hidden="true">→</span>
        </Link>
      </section>
    </section>
  );
}
