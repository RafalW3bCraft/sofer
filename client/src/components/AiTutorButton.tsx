import { useEffect, useRef, useState } from "react";
import { explainWithAi, getDeviceModelStatus, getHybridAiSetupStatus, prepareDeviceModel, type AiExplainState } from "../lib/ai";
import type { InferenceModeValue, TutorContextPacket, TutorTask } from "../../../shared/schemas";
import { readSettings } from "../lib/settings";

interface Props {
  contextPacket: TutorContextPacket;
  initialTask: TutorTask;
}

function uuidv4(): string {
  // Browser-safe UUID v4 using crypto.randomUUID when available.
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === "function") {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const TASKS: Array<{ value: TutorTask; label: string }> = [
  { value: "explain_word", label: "Explain this word" },
  { value: "explain_sentence", label: "Explain this sentence" },
  { value: "simplify_grammar", label: "Simplify the grammar" },
  { value: "contextual_example", label: "Give a contextual example" },
  { value: "explain_wrong_answer", label: "Explain a wrong answer" },
  { value: "practice_suggestion", label: "Suggest practice" },
];

const MODES: Array<{ value: InferenceModeValue; label: string }> = [
  { value: "prefer_on_device", label: "Prefer on device, fall back to cloud" },
  { value: "only_on_device", label: "On device only" },
  { value: "prefer_in_cloud", label: "Prefer cloud, fall back to device" },
  { value: "only_in_cloud", label: "Cloud only" },
];

export default function AiTutorButton({ contextPacket, initialTask }: Props) {
  const [state, setState] = useState<AiExplainState>({ kind: "idle" });
  const [task, setTask] = useState<TutorTask>(initialTask);
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const [mode, setMode] = useState<InferenceModeValue>(() => readSettings().inferenceMode);
  const [deviceStatus, setDeviceStatus] = useState<Awaited<ReturnType<typeof getDeviceModelStatus>>>({ kind: "unavailable" });
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const setup = getHybridAiSetupStatus();
  const contextKey = `${contextPacket.lessonId}:${contextPacket.sentenceId ?? ""}:${contextPacket.selectedArabic ?? ""}`;

  useEffect(() => {
    let active = true;
    controllerRef.current?.abort();
    setState({ kind: "idle" });
    void getDeviceModelStatus().then((status) => {
      if (active) setDeviceStatus(status);
    });
    return () => {
      active = false;
      controllerRef.current?.abort();
    };
  }, [contextKey]);

  const handleClick = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ kind: "loading" });
    if (mode.includes("device") && deviceStatus.kind === "downloadable") {
      setDeviceStatus({ kind: "downloading" });
      setDownloadProgress(0);
      // This call starts initializeDeviceModel synchronously in the click
      // handler to preserve Chrome's user-activation requirement.
      void prepareDeviceModel((progress) => {
        setDownloadProgress(progress);
      }).then(setDeviceStatus);
    }
    const result = await explainWithAi({
      task,
      inferenceMode: mode,
      context: {
        ...contextPacket,
        submittedQuestion: submittedQuestion.trim().slice(0, 500) || undefined,
        submittedAnswer: task === "explain_wrong_answer" ? submittedAnswer.trim().slice(0, 200) || undefined : undefined,
      },
      requestId: uuidv4(),
    }, controller.signal);
    if (controller.signal.aborted || result.kind === "cancelled") return;
    setState(result);
  };

  const handlePrepare = () => {
    setDeviceStatus({ kind: "downloading" });
    setDownloadProgress(0);
    void prepareDeviceModel(setDownloadProgress).then(setDeviceStatus);
  };

  return (
    <section className="ai-tutor" aria-label="AI tutor">
      <div className="ai-tutor__controls">
        <label>
          Tutor task
          <select value={task} onChange={(event) => { controllerRef.current?.abort(); setState({ kind: "idle" }); setTask(event.target.value as TutorTask); }}>
            {TASKS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label>
          Inference mode
          <select value={mode} onChange={(event) => { controllerRef.current?.abort(); setState({ kind: "idle" }); setMode(event.target.value as InferenceModeValue); }}>
            {MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
      </div>
      <label className="ai-tutor__question">
        What would you like help with?
        <textarea value={submittedQuestion} maxLength={500} rows={2} onChange={(event) => setSubmittedQuestion(event.target.value)} placeholder="Ask about the words, meaning, or grammar in this lesson" />
      </label>
      {task === "explain_wrong_answer" && (
        <label className="ai-tutor__question">
          What answer did you choose?
          <input value={submittedAnswer} maxLength={200} onChange={(event) => setSubmittedAnswer(event.target.value)} />
        </label>
      )}

      {!setup.configured ? (
        <p className="notice" role="status">Firebase AI is not configured in this environment. Curated lesson content remains available.</p>
      ) : !setup.appCheckReady ? (
        <p className="notice" role="status">Firebase App Check is not ready. Configure the project site key and App Check provider before using AI.</p>
      ) : null}

      <p className="ai-tutor__status" role="status">
        {deviceStatus.kind === "unsupported_browser" && "On-device inference requires supported Chrome desktop."}
        {deviceStatus.kind === "unavailable" && "On-device model is not available; cloud inference may still work."}
        {deviceStatus.kind === "downloadable" && "On-device model can be downloaded."}
        {deviceStatus.kind === "downloading" && `Downloading on-device model${downloadProgress === null ? "…" : ` — ${Math.round(downloadProgress * 100)}%`}`}
        {deviceStatus.kind === "ready" && "On-device model is ready."}
        {deviceStatus.kind === "failed" && "On-device model preparation failed; cloud fallback may still work."}
      </p>

      {deviceStatus.kind === "downloadable" && (
        <button type="button" className="btn btn--ghost" onClick={handlePrepare}>
          Prepare on-device model
        </button>
      )}
      <button
        type="button"
        className="btn"
        onClick={handleClick}
        disabled={state.kind === "loading" || !setup.configured || !setup.appCheckReady}
        aria-busy={state.kind === "loading"}
      >
        {state.kind === "loading" ? "Asking the tutor…" : "Ask Sofer tutor"}
      </button>

      {state.kind === "ok" && (
        <section className="ai-tutor__response" aria-label="AI tutor response">
          <p className="ai-tutor__meta">
            AI generated · {state.response.inferenceSource === "on_device" ? "On this device" : "Firebase cloud"} · {state.response.model}
          </p>
          <p>{state.response.explanation}</p>
          {state.response.grammarNote && <p><strong>Grammar:</strong> {state.response.grammarNote}</p>}
          {state.response.exampleArabic && <p lang="ar" dir="rtl" className="ai-tutor__arabic">{state.response.exampleArabic}</p>}
          {state.response.exampleEnglish && <p>{state.response.exampleEnglish}</p>}
          {state.response.practiceQuestion && <p><strong>Try this:</strong> {state.response.practiceQuestion}</p>}
          {state.response.confidenceOrLimitations && <p className="ai-tutor__meta">{state.response.confidenceOrLimitations}</p>}
          {state.response.curriculumReferences.length > 0 && <small>Lesson references: {state.response.curriculumReferences.join(", ")}</small>}
        </section>
      )}
      {state.kind === "fallback" && (
        <p className="notice" role="status">{state.message}</p>
      )}
    </section>
  );
}
