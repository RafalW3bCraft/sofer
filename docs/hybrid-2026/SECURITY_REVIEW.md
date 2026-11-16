# Security review

## Implemented controls

- Firebase AI outputs are schema-validated, text-rendered, bounded, and never used as lesson translations or grading keys. User text is treated as data in the tutor prompt; requests are aborted on navigation/replacement.
- App Check uses the official reCAPTCHA Enterprise provider in production configuration; local debug mode is development-only. AI is disabled when project/App Check configuration is missing.
- Firestore rules deny all by default and restrict the supported state document to the authenticated owner, expected document ID, version, and narrow data shape.
- Guest progress is local-first; Firestore import is an explicit action. Cloud deletion and local reset are explicit flows.
- Hosting CSP and security headers are prepared with explicit Firebase endpoints rather than a wildcard. The dictionary query is length-checked and parameterized by the retained server route.
- No service-account secret or live Firebase credential is stored in source.

## Open verification work

- Firestore rules need emulator tests and deployment against the owner's project.
- App Check and Firebase AI Logic require project-console enforcement verification.
- Hosting CSP must be checked against actual browser requests; current CSP is a prepared baseline, not production-tested.
- Real Firebase error behavior, quota controls, and rate-limit policy remain unverified.
- The baseline npm audit reported root 12, client 3, and server 6 findings, including critical/high advisories. After compatible upgrades and safe transitive overrides, current audits report root 0, client 0, server 4 moderate dev/migration-tool findings, and no high/critical findings. Re-evaluate those moderate advisories before release.
- Legacy Better Auth source and database tables remain but routes are no longer mounted; remove only after separate review of historical deployment needs.
