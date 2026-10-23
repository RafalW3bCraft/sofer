import { useEffect, useState } from "react";
import {
  subscribeArabicSpeech,
  getArabicSpeechStatus,
  type ArabicSpeechStatus,
} from "./speech";

/**
 * React hook: subscribes to the live speech status and re-renders the
 * caller whenever `voiceschanged` fires. Cleans up on unmount.
 */
export function useArabicSpeechStatus(): ArabicSpeechStatus {
  const [status, setStatus] = useState<ArabicSpeechStatus>(() =>
    getArabicSpeechStatus()
  );
  useEffect(() => {
    return subscribeArabicSpeech(setStatus);
  }, []);
  return status;
}