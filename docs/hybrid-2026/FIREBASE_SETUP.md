# Firebase setup

This repository uses Firebase JS SDK 13.3.0 and requires Node 24.12 or newer (`.nvmrc`). Use the existing Firebase project and register a Web app; copy its public Web configuration to the repo-root `.env` using `.env.example`.

## Environment status (2026-11-19)

- Firebase CLI 15.37.0 is available through Corepack/npm. The current CLI session is authenticated and can list two existing projects.
- The owner selected a new Firebase project. Its globally unique project ID is awaiting confirmation; no remote Firebase resources have been created or changed.
- This checkout has no selected project ID or Firebase Web config in the ignored root `.env`. Do not send a service-account key or App Check debug token.
- The user's Parrot shell has Node 20.19.2 but no `npx`. Corepack can provide a compatible npm/npx pair without installing packages system-wide.

## Provision and connect the project

Use these commands in the Sofer repository. If `npx` is missing, invoke it through Corepack:

```bash
corepack prepare npm@10.9.2 --activate
corepack npx --yes firebase-tools@latest --version
corepack npx --yes firebase-tools@latest login --no-localhost
corepack npx --yes firebase-tools@latest login:list
corepack npx --yes firebase-tools@latest projects:create <PROJECT_ID> --display-name "Sofer Hybrid AI"
corepack npx --yes firebase-tools@latest use <PROJECT_ID>
corepack npx --yes firebase-tools@latest apps:list --project <PROJECT_ID>
corepack npx --yes firebase-tools@latest init ailogic --project <PROJECT_ID>
```

If `corepack` is missing too, install Node.js 24.12+ with npm from the official Node.js distribution, then rerun the Corepack/npm commands. `npm@10` runs on Node 20.19.2; the Sofer app itself requires Node 24.12+.

The `projects:create` command creates a Google Cloud/Firebase project; verify the ID carefully. `init ailogic` provisions Firebase AI Logic. Register a Web app, copy its public Web config into the ignored root `.env`, and register the production reCAPTCHA Enterprise App Check key before building. The hybrid Web guide recommends the Gemini Developer API for the quickest setup; verify project access/quota with an actual request. [Firebase hybrid Web guide](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started)

After the project is provisioned and production variables are set:

```bash
npm run build
corepack npx --yes firebase-tools@latest deploy --only hosting --project <PROJECT_ID>
```

Before using or creating Firestore, run `corepack npx --yes firebase-tools@latest firestore:databases:list --project <PROJECT_ID>`, inspect the selected database with `firestore:databases:get`, and confirm its edition and location. Select the intended instance explicitly. This app currently uses the Standard Web Firestore client; do not create an Enterprise database without first checking SDK compatibility and explicitly selecting its location. Progress sync is optional; the guest learning and AI experience does not require provisioning a database.

For local Auth and Firestore only, start the configured emulators with `corepack npx --yes firebase-tools@latest emulators:start --only auth,firestore --project demo-sofer`. In `.env`, set the Firebase Web config and `VITE_USE_FIREBASE_EMULATORS=true`; the app connects Auth on port 9099 and Firestore on 8080. AI Logic is not emulated: use a live project and App Check debug token for actual AI requests.

## AI Logic and App Check

1. Enable Firebase AI Logic and select the Gemini Developer API or Agent Platform provider supported by the project.
2. Register reCAPTCHA Enterprise as the production App Check provider for the web app. Put its site key in `VITE_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY`.
3. Firebase AI Logic App Check is automatically enforced for projects as of November 2, 2026. Confirm the AI Logic API status under Firebase Console > Security > App Check. Do not disable enforcement as a workaround.
4. For local Auth/Firestore emulators, set `VITE_USE_FIREBASE_EMULATORS=true`. For live AI testing from localhost, leave emulators off, set `VITE_FIREBASE_APPCHECK_DEBUG=true`, open the browser, and register its generated debug token under App Check > Apps > Manage debug tokens. Keep that token private and out of Git. For production, configure reCAPTCHA Enterprise; never ship debug mode.
5. Enable Email/Password in Firebase Authentication if optional accounts are desired.
6. Run Firestore security-rule tests against the Emulator Suite before deploying `firestore.rules` or enabling progress sync. Deploy only after verifying the selected project and database.

`gemini-3.5-flash-lite` is a currently supported stable Firebase AI Logic Gemini model according to the official model list. The selected project's provider, billing plan, region, quota, and model access still require a real cloud request to confirm. Firebase model support can change; check the [official model list](https://firebase.google.com/docs/ai-logic/models) when configuring the project.

The Firebase web configuration contains public client identifiers, not service-account credentials. Never put a service-account key in Vite variables.
