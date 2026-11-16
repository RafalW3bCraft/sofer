# Technical decisions

## D-001 — Node runtime

Use Node 24.12+ (Node 24 LTS) across local instructions, CI and production because the selected Firebase JS SDK 13.3.0 AI modules declare that engine minimum. Node 22 remains a baseline-only runtime and is no longer a supported CI target.

## D-002 — Firebase AI Logic provider

Use modular `firebase/app`, `firebase/ai`, and `firebase/app-check`; use `GoogleAIBackend` and SDK `InferenceMode` constants. Pin the cloud model to `gemini-3.5-flash-lite` unless the existing project’s enabled provider does not support it; record any project-specific change.

## D-003 — Inference truthfulness

The selected mode is intent, not proof. Display `result.response.inferenceSource`; only a real `ON_DEVICE` result counts as device inference. Chrome desktop 139+ is the web device target. Model preparation is started from a learner gesture and can take minutes.

## D-004 — Arabic content trust

Preserve current content and IDs. New lessons carry provenance/review status. Draft examples are visibly labeled and excluded from trusted grading and authoritative curriculum retrieval. Do not claim native-speaker review.

## D-005 — Accounts and sync

Firebase Auth becomes the active optional account system; Firestore sync is owner-scoped and versioned. Guest/localStorage stays first-class. Do not migrate Better Auth credentials because the owner confirmed no active users; leave existing DB records untouched and retain the unrelated dictionary API.

## D-006 — External operations

Do not push, deploy, publish a video, or modify Firebase console settings without explicit authorization. Prepare config and setup instructions; document each external owner action.
