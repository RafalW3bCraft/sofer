# Deployment preparation

Deployment has not been run. `firebase.json` prepares Firebase Hosting for the SPA and a Cloud Run rewrite for the existing Express dictionary API. Before deployment:

- Supply the existing Firebase project and register its web app.
- Configure production reCAPTCHA Enterprise App Check, enable AI Logic enforcement, and deploy Firestore rules.
- Build the client with production Firebase public config; ensure no debug token or development emulator flag appears in the built assets.
- Deploy the Express API as Cloud Run service `sofer-api` in `us-central1` with the required PostgreSQL connectivity, then confirm dictionary access through Hosting.
- Review CSP against the actual Firebase endpoints used in browser network traces. Keep origins narrow.
- Run production checks, then obtain explicit release authorization before deploying.

Public deployment URL: **not set**.
