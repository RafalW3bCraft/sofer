/**
 * Browser speech synthesis wrapper with reactive Arabic-voice detection.
 *
 * Returns the availability status. Callers hide or disable the "Listen"
 * button when no Arabic voice is enumerated in the browser.
 *
 * The status is exposed via:
 *   - `getArabicSpeechStatus()` — current snapshot (still useful in tests)
 *   - `subscribeArabicSpeech(listener)` — receive an event whenever the
 *     browser's enumerated voice set changes (initial check, voiceschanged,
 *     manual `invalidate()`).
 *   - `useArabicSpeechStatus()` — React hook that subscribes/unsubscribes
 *     on mount/unmount and forces a re-render on every change.
 *
 * Detection rules:
 *   - "unsupported"  — `speechSynthesis` is not on `window`.
 *   - "no_arabic_voice" — the API exists but no voice whose `lang` starts
 *     with `"ar"` is enumerated.
 *   - "ready" — an Arabic voice is available.
 */

export type ArabicSpeechStatus =
  | { kind: "ready"; voice: SpeechSynthesisVoice }
  | { kind: "no_arabic_voice"; availableLanguages: string[] }
  | { kind: "unsupported" };

type Listener = (status: ArabicSpeechStatus) => void;
const listeners = new Set<Listener>();
let cached: ArabicSpeechStatus | null = null;
let subscribed = false;

function compute(): ArabicSpeechStatus {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { kind: "unsupported" };
  }
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  if (voices.length === 0) {
    return { kind: "no_arabic_voice", availableLanguages: [] };
  }
  const arabic = voices.find(
    (v) => v.lang && v.lang.toLowerCase().startsWith("ar")
  );
  if (!arabic) {
    return {
      kind: "no_arabic_voice",
      availableLanguages: Array.from(
        new Set(voices.map((v) => v.lang))
      ).sort(),
    };
  }
  return { kind: "ready", voice: arabic };
}

function refresh(): ArabicSpeechStatus {
  cached = compute();
  for (const l of listeners) l(cached);
  return cached;
}

function ensureSubscription(): void {
  if (subscribed) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  // Some browsers fire `voiceschanged` even for the initial population.
  // `refresh()` is idempotent; running it on first subscribe is safe.
  synth.addEventListener?.("voiceschanged", refresh);
  // Some older browsers only support `onvoiceschanged`. Register both
  // — the event is well-defined and re-running refresh is cheap.
  synth.onvoiceschanged = refresh;
  subscribed = true;
}

export function getArabicSpeechStatus(): ArabicSpeechStatus {
  if (cached === null) {
    cached = compute();
    ensureSubscription();
  }
  return cached;
}

export function subscribeArabicSpeech(listener: Listener): () => void {
  listeners.add(listener);
  ensureSubscription();
  // Send the current value immediately so subscribers don't have to
  // call getArabicSpeechStatus separately.
  listener(getArabicSpeechStatus());
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Force a recomputation and notify subscribers. Useful for tests and for
 * manual "retry" affordances if the first detection happened before any
 * voice was loaded.
 */
export function invalidateArabicSpeech(): ArabicSpeechStatus {
  return refresh();
}

export function speakArabic(text: string): boolean {
  const status = getArabicSpeechStatus();
  if (status.kind !== "ready") return false;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = status.voice.lang || "ar";
  utter.voice = status.voice;
  utter.rate = 0.9;
  synth.speak(utter);
  return true;
}