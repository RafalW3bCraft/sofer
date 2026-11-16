import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from "firebase/app-check";

const env = import.meta.env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
};

const requiredKeys: Array<keyof typeof config> = [
  "apiKey",
  "authDomain",
  "projectId",
  "appId",
];

const configured = requiredKeys.every((key) => Boolean(config[key]));
export const firebaseApp: FirebaseApp | null = configured
  ? initializeApp(config)
  : null;

let appCheck: AppCheck | null = null;
let appCheckError: string | null = null;

export function initializeSoferAppCheck(): AppCheck | null {
  if (!firebaseApp) return null;
  if (appCheck) return appCheck;
  if (env.DEV && env.VITE_USE_FIREBASE_EMULATORS === "true") return null;

  const siteKey = env.VITE_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY as
    | string
    | undefined;
  if (!siteKey) {
    appCheckError = "reCAPTCHA Enterprise site key is not configured";
    return null;
  }

  try {
    if (
      env.DEV &&
      env.VITE_FIREBASE_APPCHECK_DEBUG === "true" &&
      typeof self !== "undefined"
    ) {
      const debugSelf = self as typeof self & {
        FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean;
      };
      debugSelf.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    appCheck = initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckError = null;
    return appCheck;
  } catch {
    appCheckError = "Firebase App Check could not be initialized";
    return null;
  }
}

export function getFirebaseConfigStatus(): {
  configured: boolean;
  appCheckReady: boolean;
  appCheckError: string | null;
} {
  return {
    configured: Boolean(firebaseApp),
    appCheckReady: Boolean(appCheck) || Boolean(env.DEV && env.VITE_USE_FIREBASE_EMULATORS === "true"),
    appCheckError,
  };
}
