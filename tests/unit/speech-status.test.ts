/**
 * Tests for the speech module: status detection and reactivity.
 * Run under node with a stubbed `window` so we don't need jsdom.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Listener = (status: unknown) => void;

interface StubVoice {
  lang: string;
  name: string;
}

function makeStubSpeechSynthesis(opts: {
  initialVoices: StubVoice[];
  fireVoicesChanged?: boolean;
}) {
  let voices: StubVoice[] = [...opts.initialVoices];
  const listeners = new Set<Listener>();
  const stub = {
    _voices: voices,
    _listeners: listeners,
    _onvoiceschanged: null as Listener | null,
    getVoices: () => voices.slice(),
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    cancel: () => undefined,
    speak: () => undefined,
    _setVoices(next: StubVoice[]) {
      voices = next;
      for (const l of listeners) l({});
    },
  };
  Object.defineProperty(stub, "onvoiceschanged", {
    get() {
      return stub._onvoiceschanged;
    },
    set(l: Listener | null) {
      stub._onvoiceschanged = l;
    },
  });
  return stub;
}

describe("ArabicSpeechStatus", () => {
  let originalWindow: unknown;
  let originalSpeechSynthesis: unknown;

  beforeEach(() => {
    vi.resetModules();
    originalWindow = (globalThis as { window?: unknown }).window;
    originalSpeechSynthesis = (globalThis as { speechSynthesis?: unknown })
      .speechSynthesis;
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = originalWindow;
    }
    if (originalSpeechSynthesis === undefined) {
      delete (globalThis as { speechSynthesis?: unknown }).speechSynthesis;
    } else {
      (globalThis as { speechSynthesis?: unknown }).speechSynthesis =
        originalSpeechSynthesis;
    }
  });

  it("returns 'unsupported' when speechSynthesis is missing", async () => {
    (globalThis as { window?: unknown }).window = {};
    delete (globalThis as { speechSynthesis?: unknown }).speechSynthesis;
    const { getArabicSpeechStatus } = await import("../../client/src/lib/speech");
    expect(getArabicSpeechStatus().kind).toBe("unsupported");
  });

  it("returns 'ready' when an Arabic voice is enumerated", async () => {
    const synth = makeStubSpeechSynthesis({
      initialVoices: [{ lang: "ar-SA", name: "Arabic Voice" }],
    });
    (globalThis as { window?: unknown }).window = { speechSynthesis: synth };
    (globalThis as { speechSynthesis?: unknown }).speechSynthesis = synth;
    const { getArabicSpeechStatus } = await import("../../client/src/lib/speech");
    const s = getArabicSpeechStatus();
    expect(s.kind).toBe("ready");
    if (s.kind === "ready") {
      expect(s.voice.lang).toBe("ar-SA");
    }
  });

  it("returns 'no_arabic_voice' when only non-Arabic voices exist", async () => {
    const synth = makeStubSpeechSynthesis({
      initialVoices: [
        { lang: "en-US", name: "English" },
        { lang: "fr-FR", name: "French" },
      ],
    });
    (globalThis as { window?: unknown }).window = { speechSynthesis: synth };
    (globalThis as { speechSynthesis?: unknown }).speechSynthesis = synth;
    const { getArabicSpeechStatus } = await import("../../client/src/lib/speech");
    const s = getArabicSpeechStatus();
    expect(s.kind).toBe("no_arabic_voice");
    if (s.kind === "no_arabic_voice") {
      expect(s.availableLanguages).toEqual(["en-US", "fr-FR"]);
    }
  });

  it("notifies subscribers when voices change", async () => {
    const synth = makeStubSpeechSynthesis({
      initialVoices: [],
    });
    (globalThis as { window?: unknown }).window = { speechSynthesis: synth };
    (globalThis as { speechSynthesis?: unknown }).speechSynthesis = synth;
    const { subscribeArabicSpeech } = await import(
      "../../client/src/lib/speech"
    );
    const seen: string[] = [];
    const unsub = subscribeArabicSpeech((s) => seen.push(s.kind));
    // Initial value
    expect(seen[0]).toBe("no_arabic_voice");
    // Inject an Arabic voice and simulate the browser event.
    synth._setVoices([{ lang: "ar", name: "Arabic" }]);
    expect(seen).toContain("ready");
    unsub();
  });

  it("subscribe returns an unsubscribe function", async () => {
    const synth = makeStubSpeechSynthesis({
      initialVoices: [],
    });
    (globalThis as { window?: unknown }).window = { speechSynthesis: synth };
    (globalThis as { speechSynthesis?: unknown }).speechSynthesis = synth;
    const { subscribeArabicSpeech } = await import(
      "../../client/src/lib/speech"
    );
    const seen: string[] = [];
    const unsub = subscribeArabicSpeech((s) => seen.push(s.kind));
    synth._setVoices([{ lang: "ar", name: "Arabic" }]);
    const beforeUnsub = seen.length;
    unsub();
    synth._setVoices([]);
    expect(seen.length).toBe(beforeUnsub);
  });
});