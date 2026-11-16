# Firebase setup

This repository uses Firebase JS SDK 13.3.0 and requires Node 24.12 or newer (`.nvmrc`). Use the existing Firebase project and register a Web app; copy its public Web configuration to the repo-root `.env` using `.env.example`.

## AI Logic and App Check

1. Enable Firebase AI Logic and select the Gemini Developer API or Agent Platform provider supported by the project.
2. Register reCAPTCHA Enterprise as the production App Check provider for the web app. Put its site key in `VITE_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY`.
3. Enable App Check enforcement for Firebase AI Logic in the Firebase console. Do not enable the debug provider in a production build.
4. For local development, set `VITE_USE_FIREBASE_EMULATORS=true` only when using Auth/Firestore emulators. For live AI testing, configure a development App Check debug token and register that token in the Firebase console; never publish it.
5. Enable Email/Password in Firebase Authentication if optional accounts are desired.
6. Deploy `firestore.rules` before enabling progress sync.

`gemini-3.5-flash-lite` is a currently supported stable Firebase AI Logic Gemini model according to the official model list. The selected project's provider, billing plan, region, quota, and model access still require a real cloud request to confirm. Firebase model support can change; check the [official model list](https://firebase.google.com/docs/ai-logic/models) when configuring the project.

The Firebase web configuration contains public client identifiers, not service-account credentials. Never put a service-account key in Vite variables.
