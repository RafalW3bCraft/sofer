/**
 * Wraps window.speechSynthesis with Arabic-voice detection.
 *
 * Returns the availability status; callers hide or disable the "Listen"
 * button when no Arabic voice is enumerated in the browser.
 */

export type ArabicSpeechStatus =
  | { kind: "ready"; voice: SpeechSynthesisVoice }
  | { kind: "no_arabic_voice"; availableLanguages: string[] }
  | { kind: "unsupported" };

let cached: ArabicSpeechStatus | null = null;

export function getArabicSpeechStatus(): ArabicSpeechStatus {
  if (cached) return cached;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    cached = { kind: "unsupported" };
    return cached;
  }
  const synth = window.speechSynthesis;
  // Some browsers populate voices asynchronously; if the list is empty,
  // wait briefly and re-check.
  let voices = synth.getVoices();
  if (voices.length === 0) {
    // Return "no_arabic_voice" for now; the UI re-checks on user interaction
    // via the `voiceschanged` event.
    cached = { kind: "no_arabic_voice", availableLanguages: [] };
    synth.addEventListener?.("voiceschanged", () => {
      cached = null; // force recompute
    });
    return cached;
  }
  const arabic = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("ar"));
  if (!arabic) {
    cached = {
      kind: "no_arabic_voice",
      availableLanguages: Array.from(new Set(voices.map((v) => v.lang))).sort(),
    };
    synth.addEventListener?.("voiceschanged", () => {
      cached = null;
    });
    return cached;
  }
  cached = { kind: "ready", voice: arabic };
  return cached;
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