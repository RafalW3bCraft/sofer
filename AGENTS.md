# Sofer repository instructions

- Inspect existing implementation and repository status before edits. Preserve user changes and the guest learning path.
- For substantial work, use the applicable installed ECC skills (especially `market-research`, `security-review`, `tdd-workflow`, `e2e-testing`, and `verification-loop`) and follow research → plan → implement → verify → document.
- Keep `docs/hybrid-2026/STATUS.md`, `EVIDENCE.md`, and the relevant setup/release document current. Separate mocked CI evidence from real Firebase/browser observations.
- Firebase AI claims must use the SDK's actual `inferenceSource`. Do not claim on-device behavior based on selected mode alone.
- Keep unreviewed Arabic lessons marked as drafts and out of grading/trusted tutor context. Never let generated text replace reviewed translations or answer keys.
- Keep Firebase secrets and local credentials out of Git and reports. Do not publish, push, deploy, or modify Firebase resources without explicit owner authorization.
- Use the Node version in `.nvmrc`; do not remove the dictionary API or historical SQL migration/schema data as part of cleanup.
- Run the smallest relevant checks after each change, then all release gates for submission work. `SOFER_E2E_PORT` may be set to a free port to run Playwright without interrupting a local learner session.
