import { getFirebaseConfigStatus } from "./firebase/config";
import { createFirebaseTutorProvider } from "./ai/firebaseProvider";
import { createHybridTutorService, type DeviceModelStatus } from "./ai/hybridService";
import type { TutorRequest, TutorResponse } from "../../../shared/schemas";

const firebaseProvider = createFirebaseTutorProvider();
const tutorService = firebaseProvider
  ? createHybridTutorService(firebaseProvider)
  : null;

export type AiExplainState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; response: TutorResponse }
  | { kind: "fallback"; reason: string; message: string }
  | { kind: "cancelled" };

export function getHybridAiSetupStatus() {
  return getFirebaseConfigStatus();
}

export async function getDeviceModelStatus(): Promise<DeviceModelStatus> {
  if (!tutorService) return { kind: "unavailable" };
  return tutorService.getDeviceAvailability();
}

export async function prepareDeviceModel(
  onProgress: (progress: number) => void = () => undefined,
): Promise<DeviceModelStatus> {
  if (!tutorService) return { kind: "unavailable" };
  return tutorService.prepareDeviceModel(onProgress);
}

export async function explainWithAi(
  payload: TutorRequest,
  signal?: AbortSignal,
): Promise<AiExplainState> {
  if (!tutorService) {
    const status = getFirebaseConfigStatus();
    const reason = status.configured ? "app_check_unavailable" : "firebase_not_configured";
    return {
      kind: "fallback",
      reason,
      message: "Firebase AI is not configured for this environment. The curated lesson content is still available.",
    };
  }
  return tutorService.explain(payload, signal);
}
