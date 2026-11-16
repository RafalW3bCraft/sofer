import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
} from "firebase/ai";
import type { InferenceMode as FirebaseInferenceMode } from "firebase/ai";
import { firebaseApp, initializeSoferAppCheck } from "../firebase/config";
import type {
  DeviceAvailability,
  HybridTutorModel,
  HybridTutorProvider,
} from "./hybridService";
import type { InferenceModeValue } from "../../../../shared/schemas";

const CLOUD_MODEL = "gemini-3.5-flash-lite";

const cloudResponseSchema = {
  type: "OBJECT",
  properties: {
    explanation: { type: "STRING" },
    grammarNote: { type: "STRING", nullable: true },
    exampleArabic: { type: "STRING", nullable: true },
    exampleEnglish: { type: "STRING", nullable: true },
    practiceQuestion: { type: "STRING", nullable: true },
    practiceAnswer: { type: "STRING", nullable: true },
    confidenceOrLimitations: { type: "STRING", nullable: true },
    curriculumReferences: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["explanation", "curriculumReferences"],
} as const;

function toFirebaseMode(mode: InferenceModeValue): FirebaseInferenceMode {
  switch (mode) {
    case "prefer_on_device": return InferenceMode.PREFER_ON_DEVICE;
    case "only_on_device": return InferenceMode.ONLY_ON_DEVICE;
    case "prefer_in_cloud": return InferenceMode.PREFER_IN_CLOUD;
    case "only_in_cloud": return InferenceMode.ONLY_IN_CLOUD;
  }
}

interface LanguageModelWindow extends Window {
  LanguageModel?: {
    availability(): Promise<"available" | "downloadable" | "downloading" | "unavailable">;
  };
}

function chromeDesktopSupportsPromptApi(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|Mobile|Edg\/|OPR\/|SamsungBrowser/i.test(ua)) return false;
  const chromeVersion = ua.match(/Chrome\/(\d+)/)?.[1];
  return Number(chromeVersion) >= 139;
}

export function createFirebaseTutorProvider(): HybridTutorProvider | null {
  if (!firebaseApp || !initializeSoferAppCheck()) return null;
  const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

  return {
    async getDeviceAvailability(): Promise<DeviceAvailability> {
      if (!chromeDesktopSupportsPromptApi()) return "unsupported_browser";
      const languageModel = (window as LanguageModelWindow).LanguageModel;
      if (!languageModel) return "unavailable";
      try {
        return await languageModel.availability();
      } catch {
        return "unavailable";
      }
    },

    createModel(mode: InferenceModeValue): HybridTutorModel {
      const model = getGenerativeModel(ai, {
        mode: toFirebaseMode(mode),
        inCloudParams: {
          model: CLOUD_MODEL,
          generationConfig: {
            maxOutputTokens: 450,
            responseMimeType: "application/json",
            responseJsonSchema: cloudResponseSchema,
          },
        },
      });
      return {
        initializeDeviceModel: (onProgress) => model.initializeDeviceModel(onProgress),
        async generate(prompt, signal) {
          const result = await model.generateContent(
            prompt,
            signal ? { signal } : undefined,
          );
          return {
            content: result.response.text(),
            inferenceSource: result.response.inferenceSource,
          };
        },
      };
    },
  };
}

export { CLOUD_MODEL };
