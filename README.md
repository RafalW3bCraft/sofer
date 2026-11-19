# sofer — Learn Arabic through real sentences

sofer is a guest-first, React learning app for beginner Modern Standard Arabic. Learners read reviewed sentences, inspect word-level meaning and grammar, answer fixed comprehension questions, and practice vocabulary and sentence reconstruction. An optional Firebase AI Logic tutor can explain trusted lesson content using on-device or cloud inference when the Firebase project is configured.

This repository predates the Firebase Hybrid AI Hackathon submission period. See [the baseline](docs/hybrid-2026/BASELINE.md) and [existing-work disclosure](docs/hybrid-2026/EXISTING_WORK_DISCLOSURE.md).

## Requirements and local setup

Use Node.js **24.12 or newer** and npm. The project runtime is pinned in `.nvmrc`.

```bash
nvm use
npm ci
npm --prefix client ci
npm --prefix server ci
npm run dev
```

Open <http://127.0.0.1:5173/>. Guest lessons work without Firebase credentials. To enable Firebase AI, optional sign-in, and Firestore sync, copy `.env.example` to the repository root `.env`, fill in the existing Firebase Web app configuration and reCAPTCHA Enterprise site key, then follow [Firebase setup](docs/hybrid-2026/FIREBASE_SETUP.md). Do not commit `.env` or a service-account credential. Real AI use also needs the project's Firebase AI Logic provider/model access and App Check configuration.

For production-style local build and preview:

```bash
npm run build
npm start
```

Firebase Hosting, Firestore rules, and emulator configuration are prepared in `firebase.json` and `firestore.rules`. They have not been deployed. The Hosting dictionary rewrite expects a separately configured Cloud Run service named `sofer-api` in `us-central1`.

## Learning content and features

- 12 A1 lesson records and 48 sentences preserve the original lesson IDs.
- The 3 original lessons (7 sentences) are the trusted pack. Nine added lessons (41 sentences) are candidate drafts because no qualified Arabic reviewer was available. The app labels these drafts, allows ungraded previews, and excludes them from AI grounding and grading.
- Tappable Arabic tokens show their contextual gloss and grammar note. Keyboard users can move between tokens and close details with Escape.
- Reviewed lessons retain deterministic comprehension questions and local progress. Arabic audio uses browser speech synthesis when an Arabic voice is available.
- Practice includes vocabulary recall, sentence reconstruction, and a simple spaced review schedule. It is a practice aid, not a scientifically validated learning measure.
- Firebase Auth is optional. Progress remains local unless a learner chooses to merge it into their own Firestore state document.
- The AI tutor supports four Firebase inference modes. The interface reports the SDK response's actual inference source; a selected mode does not imply that a request ran on-device.

## Quality checks

```bash
npm run validate:lessons
npm run validate:alphabet
npm run check
npm test
npm run build
npx playwright install chromium  # first time only
npm run test:e2e
npm run hygiene
```

See [the current test report](docs/hybrid-2026/TEST_REPORT.md) for outcomes and skipped external integration checks. Unit doubles are not real Firebase inference evidence.

## Technical and release documentation

- [Architecture](docs/hybrid-2026/ARCHITECTURE.md)
- [Firebase project setup](docs/hybrid-2026/FIREBASE_SETUP.md)
- [On-device model setup](docs/hybrid-2026/LOCAL_MODEL_SETUP.md)
- [Deployment preparation](docs/hybrid-2026/DEPLOYMENT.md)
- [Security review](docs/hybrid-2026/SECURITY_REVIEW.md)
- [Evidence ledger](docs/hybrid-2026/EVIDENCE.md)
- [Demo script draft](docs/hybrid-2026/DEMO_SCRIPT.md)
- [Submission checklist](docs/hybrid-2026/SUBMISSION_CHECKLIST.md)
- [Industry and hackathon readiness audit](docs/hybrid-2026/INDUSTRY_AND_READINESS_AUDIT.md)
- [ECC setup](docs/hybrid-2026/ECC_SETUP.md)

Firebase project setup, real cloud/on-device inference, Arabic review, production deployment, and public demo-video URL remain unverified or owner-dependent. No deployment or publication has been performed.

## License

MIT — see [LICENSE](LICENSE).
