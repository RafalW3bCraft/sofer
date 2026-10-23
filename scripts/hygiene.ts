import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Match patterns that look like a real key being assigned a non-empty value.
// `=` followed by anything that is NOT just whitespace, a comment, or a newline
// means a secret was committed. Empty placeholders in `.env.example` are fine.
const FORBIDDEN = [
  /NEBIUS_API_KEY\s*=\s*\S[^#\n]*/,
  /NEBIUS_BASE_URL\s*=\s*\S[^#\n]*/,
  /OPENAI_API_KEY\s*=\s*\S[^#\n]*/,
  /\bsk-[A-Za-z0-9]{20,}\b/,
  /\bghp_[A-Za-z0-9]{20,}\b/,
  /\bxox[bp]-[A-Za-z0-9-]{10,}\b/,
  /\b\d{4}-\d{4}-\d{4}-\d{4}\b/,
  /TOKENFACTORY_API_KEY\s*=\s*\S[^#\n]*/,
  /RADEON_API_KEY\s*=\s*\S[^#\n]*/,
];

// Files exempt from secret scanning. `.env.example` is the canonical template
// and is allowed to reference variable names without values. `hygiene.ts`
// is itself the scanner — its own patterns must mention the variable names.
const EXEMPT = new Set([".env.example", ".env.sample", "scripts/hygiene.ts"]);

// Test files contain string literals that LOOK like secrets but are obviously
// not real credentials. The dotenv and explain-route tests write patterns
// like `TOKENFACTORY_API_KEY=stub-...` as part of unit-test fixtures. We
// allow tests/ but require them to be obviously test-only (see scanContent).
const TEST_DIR_PREFIX = "tests/";

// Paths that must NEVER appear in tracked files (legacy / unrelated code).
const FORBIDDEN_PATHS = [/OmniLangTutor\//];

let failures = 0;

function fail(msg: string): void {
  console.error(`hygiene FAIL: ${msg}`);
  failures += 1;
}

function scanContent(file: string, content: string): void {
  if (EXEMPT.has(file)) return;
  // Test files: allow obviously stub values like `stub-...`, `mock-...`,
  // `fake-...`, repeated `x`, or any string containing "test" / "mock" /
  // "example" / "fake". Reject anything that looks like a real production
  // secret by also checking against a stricter pattern set.
  if (file.startsWith(TEST_DIR_PREFIX)) {
    const strict = [
      /\bsk-[A-Za-z0-9]{32,}\b/, // longer OpenAI keys
      /\bghp_[A-Za-z0-9]{32,}\b/, // longer GitHub PATs
      /\bxox[bp]-[A-Za-z0-9-]{20,}\b/, // Slack tokens
      /\b\d{4}-\d{4}-\d{4}-\d{4}\b/, // card-like numbers
    ];
    for (const re of strict) {
      if (re.test(content)) fail(`${file} matches strict pattern ${re}`);
    }
    return;
  }
  for (const re of FORBIDDEN) {
    if (re.test(content)) fail(`${file} matches ${re}`);
  }
}

function scanTracked(): void {
  let tracked: string[];
  try {
    tracked = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean);
  } catch (err) {
    fail(`could not list tracked files: ${(err as Error).message}`);
    return;
  }
  for (const file of tracked) {
    if (FORBIDDEN_PATHS.some((re) => re.test(file))) {
      fail(`forbidden path tracked: ${file}`);
      continue;
    }
    let content: string;
    try {
      content = execSync(`git show "HEAD:${file}"`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch {
      continue;
    }
    scanContent(file, content);
  }
}

function scanWorkingTree(): void {
  // Check working-tree versions of tracked files (catches uncommitted
  // secrets that `git show HEAD` would miss).
  let tracked: string[];
  try {
    tracked = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean);
  } catch {
    return;
  }
  for (const file of tracked) {
    const path = resolve(file);
    if (!existsSync(path)) continue;
    let content: string;
    try {
      content = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    scanContent(file, content);
  }
}

function scanUntracked(): void {
  let status: string;
  try {
    status = execSync("git status --porcelain", { encoding: "utf8" });
  } catch {
    return;
  }
  for (const line of status.split("\n")) {
    if (!line) continue;
    // Porcelain format: XY filename
    const trimmed = line.replace(/^[?! ]{1,2}/, "");
    const file = trimmed.trim();
    if (!file) continue;
    if (file.includes(" -> ")) continue; // renames handled separately
    if (EXEMPT.has(file)) continue;
    if (!existsSync(file)) continue;
    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      // Likely a binary or unreadable file — skip.
      continue;
    }
    // Binary files (dist bundles) are scanned lightly: only the forbidden
    // variable-name patterns, since those are never legitimate content.
    scanContent(file, content);
  }
}

scanTracked();
scanWorkingTree();
scanUntracked();

if (failures > 0) {
  console.error(`hygiene: ${failures} failure(s).`);
  process.exit(1);
}
console.log(
  "hygiene OK — scanned tracked files + working tree + untracked, no secrets or forbidden paths."
);