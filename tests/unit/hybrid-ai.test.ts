import { describe, expect, it, vi } from "vitest";
import { createHybridTutorService, type HybridTutorProvider } from "../../client/src/lib/ai/hybridService";
import type { TutorRequest } from "../../shared/schemas";

const validRequest: TutorRequest = {
  task: "explain_word",
  inferenceMode: "prefer_on_device",
  requestId: "0bdb5ea2-71bc-4cd0-b8a1-23b9e6c83803",
  context: {
    lessonId: "greetings-1",
    lessonTitle: "Greetings",
    learningObjective: "Respond to a greeting.",
    sentenceArabic: "مَرْحَبًا",
    selectedArabic: "مَرْحَبًا",
    selectedMeaning: "hello",
    nearbyExamples: [],
    learnerLevel: "beginner",
    recentMistakeConcepts: [],
    dueReviewItems: [],
  },
};

function providerFor(
  content: string,
  inferenceSource = "on_device",
): HybridTutorProvider {
  const model = {
    initializeDeviceModel: vi.fn(async (_progress?: (value: number) => void) => {
      _progress?.(0.5);
    }),
    generate: vi.fn(async () => ({ content, inferenceSource })),
  };
  return {
    getDeviceAvailability: vi.fn(async () => "downloadable" as const),
    createModel: vi.fn(() => model),
  };
}

const validContent = JSON.stringify({
  explanation: "This is a greeting.",
  grammarNote: "It is used when meeting someone.",
  curriculumReferences: ["greetings-1"],
});

describe("Firebase hybrid tutor orchestration", () => {
  it("distinguishes an unsupported browser from an unavailable device model", async () => {
    const unsupported = providerFor(validContent);
    unsupported.getDeviceAvailability = vi.fn(async () => "unsupported_browser" as const);
    expect(await createHybridTutorService(unsupported).getDeviceAvailability()).toEqual({ kind: "unsupported_browser" });
    const unavailable = providerFor(validContent);
    unavailable.getDeviceAvailability = vi.fn(async () => "unavailable" as const);
    expect(await createHybridTutorService(unavailable).getDeviceAvailability()).toEqual({ kind: "unavailable" });
  });

  it("uses the selected inference mode and reports the actual source", async () => {
    const provider = providerFor(validContent, "in_cloud");
    const service = createHybridTutorService(provider);
    const result = await service.explain(validRequest);

    expect(provider.createModel).toHaveBeenCalledWith("prefer_on_device");
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.response.inferenceSource).toBe("in_cloud");
      expect(result.response.explanation).toBe("This is a greeting.");
    }
  });

  it("supports all four Firebase inference modes", async () => {
    for (const inferenceMode of [
      "prefer_on_device",
      "only_on_device",
      "prefer_in_cloud",
      "only_in_cloud",
    ] as const) {
      const provider = providerFor(validContent);
      const service = createHybridTutorService(provider);
      await service.explain({ ...validRequest, inferenceMode });
      expect(provider.createModel).toHaveBeenCalledWith(inferenceMode);
    }
  });

  it("rejects malformed model JSON without displaying it as tutor content", async () => {
    const service = createHybridTutorService(providerFor("<script>alert(1)</script>"));
    const result = await service.explain(validRequest);
    expect(result.kind).toBe("fallback");
    if (result.kind === "fallback") expect(result.reason).toBe("schema_mismatch");
  });

  it("falls back when the explanation is primarily Arabic instead of instructional English", async () => {
    const arabicContent = JSON.stringify({ explanation: "هذا شرح باللغة العربية وليس باللغة الإنجليزية", curriculumReferences: [] });
    const result = await createHybridTutorService(providerFor(arabicContent)).explain(validRequest);
    expect(result.kind).toBe("fallback");
    if (result.kind === "fallback") expect(result.reason).toBe("wrong_language_response");
  });

  it("does not claim an inference source when the SDK omits it", async () => {
    const service = createHybridTutorService(providerFor(validContent, ""));
    const result = await service.explain(validRequest);
    expect(result.kind).toBe("fallback");
    if (result.kind === "fallback") expect(result.reason).toBe("source_unavailable");
  });

  it("classifies provider errors into a safe learner message", async () => {
    const provider = providerFor(validContent);
    provider.createModel = vi.fn(() => ({
      initializeDeviceModel: vi.fn(async () => undefined),
      generate: vi.fn(async () => { throw new Error("429 quota exceeded"); }),
    }));
    const result = await createHybridTutorService(provider).explain(validRequest);
    expect(result.kind).toBe("fallback");
    if (result.kind === "fallback") expect(result.reason).toBe("rate_limited");
  });

  it("prepares a device model only when called and reports download progress", async () => {
    const provider = providerFor(validContent);
    const service = createHybridTutorService(provider);
    const updates: number[] = [];
    const status = await service.prepareDeviceModel((progress) => updates.push(progress));
    expect(provider.getDeviceAvailability).not.toHaveBeenCalled();
    expect(provider.createModel).toHaveBeenCalledWith("prefer_on_device");
    expect(updates).toContain(0.5);
    expect(status.kind).toBe("ready");
  });

  it("short-circuits cancelled requests before the provider call", async () => {
    const provider = providerFor(validContent);
    const controller = new AbortController();
    controller.abort();
    const result = await createHybridTutorService(provider).explain(validRequest, controller.signal);
    expect(result.kind).toBe("cancelled");
    expect(provider.createModel).not.toHaveBeenCalled();
  });
});
