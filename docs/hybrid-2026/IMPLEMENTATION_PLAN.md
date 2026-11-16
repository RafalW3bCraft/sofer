# Implementation checkpoints

1. **Baseline and runtime:** preserve baseline evidence; use Node 24.12+ for the selected Firebase SDK; keep checkpoints and blockers current in `STATUS.md`.
2. **Firebase AI proof:** initialize Firebase + App Check; implement the official Firebase AI Logic provider adapter, actual inference-source reporting, device preparation states, four inference modes, bounded tutor context, schema validation and curated failure behavior. Verify with test doubles first, then real project/browser checks when configured.
3. **Curriculum and learning:** replace fixed-size assumptions with versioned lesson metadata; preserve stable IDs and local progress; validate Arabic offsets and references; add trusted/draft status, review scheduling and vocabulary/sentence practice.
4. **Accounts and experience:** retain guest access; make Firebase Auth + Firestore the active optional account/sync path, with explicit import and owner-only rules; preserve the existing dictionary service. Improve the current screens incrementally rather than replacing the UI wholesale.
5. **Release readiness:** harden CSP/dependencies, complete responsive/accessibility and E2E regression coverage, maintain the requested operational docs, and prepare Firebase Hosting without deploying or publishing without separate authorization.

## Acceptance gates

- AI gate: SDK calls are the real Firebase AI Logic API; UI reports `response.inferenceSource`; local capability is claimed only after a real supported Chrome desktop run.
- Content gate: no draft material is used for trusted explanations or deterministic answer keys; all existing lesson IDs and progress compatibility remain intact.
- Data gate: guest mode works without Firebase; Firestore rules scope reads/writes to the authenticated UID; legacy Better Auth credentials are not migrated.
- Submission gate: test, security, and deployment claims have recorded evidence; deployment/video URLs remain blank until verified.
