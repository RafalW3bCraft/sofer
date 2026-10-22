import { execSync } from "node:child_process";

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
// and is allowed to reference variable names without values.
const EXEMPT = [".env.example", ".env.sample"];

const FORBIDDEN_PATHS = [/OmniLangTutor\//];

let tracked: string[];
try {
  tracked = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean);
} catch (err) {
  console.error("hygiene: could not list tracked files:", err);
  process.exit(1);
}

let failures = 0;

for (const file of tracked) {
  if (FORBIDDEN_PATHS.some((re) => re.test(file))) {
    console.error(`hygiene FAIL: forbidden path tracked: ${file}`);
    failures += 1;
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
  const isExempt = EXEMPT.includes(file);
  if (!isExempt) {
    for (const re of FORBIDDEN) {
      if (re.test(content)) {
        console.error(`hygiene FAIL: ${file} matches ${re}`);
        failures += 1;
      }
    }
  }
}

if (failures > 0) {
  console.error(`hygiene: ${failures} failure(s).`);
  process.exit(1);
}
console.log(`hygiene OK — scanned ${tracked.length} tracked files, no secrets or forbidden paths.`);