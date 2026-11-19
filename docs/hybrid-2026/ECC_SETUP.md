# ECC setup for Sofer

## Codex plugin installation

- Harness: Codex CLI `0.162.0-alpha.2`.
- ECC source: official `https://github.com/affaan-m/ECC.git` marketplace (`ecc`). It already existed in the Codex marketplace list; the source was verified before use.
- Installed plugin: `ecc@ecc`, version `2.2.3`, enabled in Codex. Installation path: `/home/victim/.codex/plugins/cache/ecc/ecc/2.2.3`.
- Installation used Codex's native plugin lifecycle: refresh the existing marketplace, add `ecc@ecc`, then verify with `codex plugin list --json`.
- Codex plugin installation is a user-harness setting, not a per-repository package. Project-specific guidance is in the root `AGENTS.md`. Restart/reload Codex so the newly installed plugin skills are available in fresh sessions.
- Codex does not map ECC's Claude-specific hook profiles to project settings. No hooks, MCP servers, credentials, or experimental multi-agent settings were enabled in this setup.

## Sofer workflows

Use the installed ECC skills when they match the task: source-attributed research for market/rules checks; security review for Firebase/App Check/data handling; TDD and E2E for behavior changes; and verification-loop for release checks. The root `AGENTS.md` records the stable project constraints.

## Verify the installation

```bash
codex plugin list --json
```

The output must show exactly one enabled `ecc@ecc` plugin. Repo-specific rules remain reviewable in `AGENTS.md`; future operators should inspect and update them with the project rather than copying global config into this checkout.
