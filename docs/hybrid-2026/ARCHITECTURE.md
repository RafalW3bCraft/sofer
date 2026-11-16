# Architecture

## Runtime paths

- React/Vite remains the product shell; existing lesson/player/alphabet/progress flows and stable lesson IDs remain in place.
- `firebase/app` initializes the existing Web app config; `firebase/app-check` establishes reCAPTCHA Enterprise attestation for production; `firebase/ai` is the active tutor integration. The client provider maps all four Firebase `InferenceMode` values and reports only Firebase's returned `inferenceSource`.
- AI orchestration is isolated in `client/src/lib/ai/hybridService.ts`, with a provider interface for unit doubles, structured response validation, bounded curriculum context, abort handling, typed failure classes, and offline curated content.
- Firebase Auth is optional. Guest progress stays in versioned localStorage. A signed-in learner must explicitly merge local progress into `users/{uid}/state/current`; Firestore rules scope access to the owner. Stable answer/token IDs and event timestamps select a deterministic winner. Explicit token removals sync as tombstones.
- The legacy Better Auth modules/schema remain in the repository for historical reference, but their routes are no longer mounted. No credentials are migrated. PostgreSQL is retained for the public curated dictionary route and other server duties.
- Existing reviewed lessons remain trusted; new candidate lessons carry `reviewStatus: draft`, are excluded from AI context and grading, and use ungraded preview navigation.

## Data boundaries

Generated tutor output is Zod-validated and rendered as ordinary React text. It cannot change lesson translations, curriculum annotations, or grading keys. Tutor history is not persisted. The user-submitted question and bounded lesson context are sent to the selected Firebase inference route.

## Firebase services

`firebase.json` prepares Hosting and Auth/Firestore emulators. Hosting serves `client/dist`; `/api/dictionary/**` rewrites to a Cloud Run service named `sofer-api` in `us-central1`. That service must be deployed/configured separately before the dictionary route is live on Hosting. No Firebase project ID or production URL is committed.
