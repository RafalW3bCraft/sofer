import { useMemo, useState } from "react";
import lessonsData from "../content/lessons.json";
import { LessonsFileSchema, tokenId } from "../../../shared/schemas";
import { getDueReviewRecords, scheduleReviewAttempt } from "../lib/reviewScheduler";
import { readReviewStore, writeReviewStore } from "../lib/reviewStorage";

const lessons = LessonsFileSchema.parse(lessonsData).lessons.filter((lesson) => lesson.reviewStatus !== "draft");
const words = lessons.flatMap((lesson) => lesson.sentences.flatMap((sentence) => sentence.tokens.map((token, index) => ({
  id: tokenId(lesson.id, sentence.id, index), arabic: token.arabic, meaning: token.meaning,
}))));
const sentences = lessons.flatMap((lesson) => lesson.sentences.map((sentence) => ({ lessonId: lesson.id, ...sentence })));

type Mode = "vocabulary" | "reconstruction";
export default function Practice() {
  const [mode, setMode] = useState<Mode>("vocabulary");
  const [store, setStore] = useState(() => readReviewStore());
  const due = useMemo(() => getDueReviewRecords(store), [store]);
  const [wordCursor, setWordCursor] = useState(0);
  const word = words.find((entry) => due.some((item) => item.tokenId === entry.id)) ?? words[wordCursor % words.length]!;
  const [wordResult, setWordResult] = useState<boolean | null>(null);
  const sentence = sentences[0]!;
  const [assembled, setAssembled] = useState<number[]>([]);
  const [sentenceResult, setSentenceResult] = useState<boolean | null>(null);
  const distractors = words.map((entry) => entry.meaning).filter((meaning, index, all) => meaning !== word.meaning && all.indexOf(meaning) === index).slice(0, 3);
  const choices = [word.meaning, ...distractors].sort((a, b) => a.localeCompare(b));
  const order = sentence.tokens.map((_, index) => index).sort((a, b) => sentence.tokens[b]!.arabic.length - sentence.tokens[a]!.arabic.length);
  if (order.every((index, position) => index === position) && order.length > 1) order.reverse();
  const assembledText = assembled.map((index) => sentence.tokens[index]!.arabic).join(" ");

  function answerWord(choice: string) {
    if (wordResult !== null) return;
    const correct = choice === word.meaning;
    setWordResult(correct);
    const next = { ...store, records: { ...store.records, [word.id]: scheduleReviewAttempt(word.id, store.records[word.id], correct) } };
    writeReviewStore(next); setStore(next);
  }
  function submitSentence() { setSentenceResult(assembledText === sentence.arabic); }

  return <section className="page practice-page">
    <h1>Practice</h1>
    <p>Practice questions use reviewed lesson content and have fixed answer keys.</p>
    <p className="practice-review-count">{due.length} vocabulary item{due.length === 1 ? "" : "s"} due for review</p>
    <div className="settings-actions" role="group" aria-label="Practice activity">
      <button className={`btn ${mode === "vocabulary" ? "btn--primary" : ""}`} onClick={() => setMode("vocabulary")}>Vocabulary recall</button>
      <button className={`btn ${mode === "reconstruction" ? "btn--primary" : ""}`} onClick={() => setMode("reconstruction")}>Sentence reconstruction</button>
    </div>
    {mode === "vocabulary" ? <section className="question" aria-labelledby="recall-heading">
      <h2 id="recall-heading" lang="ar" dir="rtl" className="practice-arabic">{word.arabic}</h2>
      <p>Choose the reviewed meaning.</p>
      <div className="question__options">{choices.map((choice) => <button key={choice} className="question__option" disabled={wordResult !== null} onClick={() => answerWord(choice)}>{choice}</button>)}</div>
      {wordResult !== null && <p className="question__feedback" role="status">{wordResult ? "Correct." : `The curated meaning is: ${word.meaning}.`} A short review interval is scheduled locally; this is a simple practice aid, not a validated learning measure.</p>}
      {wordResult !== null && <button className="btn btn--primary" onClick={() => { setWordResult(null); setWordCursor((index) => index + 1); }}>Next recall</button>}
    </section> : <section className="question" aria-labelledby="rebuild-heading">
      <h2 id="rebuild-heading">Rebuild the reviewed sentence</h2>
      <p>{sentence.english}</p>
      <div className="practice-arabic" lang="ar" dir="rtl" aria-live="polite">{assembledText || "Choose words below"}</div>
      <div className="question__options">{order.filter((index) => !assembled.includes(index)).map((index) => <button key={index} className="question__option practice-word" lang="ar" dir="rtl" onClick={() => setAssembled((value) => [...value, index])}>{sentence.tokens[index]!.arabic}</button>)}</div>
      {sentenceResult !== null && <p role="status" className="question__feedback">{sentenceResult ? "Correct sentence." : `The curated sentence is: ${sentence.arabic}`}</p>}
      {sentenceResult === null ? <button className="btn btn--primary" disabled={assembled.length !== sentence.tokens.length} onClick={submitSentence}>Check sentence</button> : <button className="btn btn--ghost" onClick={() => { setAssembled([]); setSentenceResult(null); }}>Try again</button>}
      {assembled.length > 0 && sentenceResult === null && <button className="btn btn--ghost" onClick={() => setAssembled([])}>Clear answer</button>}
    </section>}
  </section>;
}
