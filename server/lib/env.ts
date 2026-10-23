/**
 * Minimal .env loader. Dependency-free by design.
 *
 * - Reads a `.env` file from a list of candidate paths (current working dir,
 *   parent of cwd, two levels up — covers both `npm start` from repo root
 *   and from `server/`).
 * - Each line: `KEY=value`. Lines starting with `#` and blank lines are
 *   ignored. Quoted values are unwrapped.
 * - Existing `process.env` values WIN: we never overwrite a variable the
 *   operator (or the platform) already set. This is the safer default for a
 *   twelve-factor app.
 * - Never logs the values. The keys that were loaded are reported at
 *   info level so an operator can confirm the file was picked up.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

function parseDotenv(contents: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Strip an inline `# comment` only when preceded by whitespace.
    const hashIdx = value.search(/\s+#/);
    if (hashIdx >= 0) value = value.slice(0, hashIdx).trim();
    out[key] = value;
  }
  return out;
}

function candidatePaths(): string[] {
  const paths = new Set<string>();
  paths.add(resolve(process.cwd(), ".env"));
  paths.add(resolve(dirname(process.cwd()), ".env"));
  // Walk up from the server module location; useful when invoked as
  // `node dist/index.js` from inside `server/`.
  const here = dirname(fileURLToPath(import.meta.url));
  paths.add(resolve(here, "../../.env"));
  paths.add(resolve(here, "../../../.env"));
  paths.add(resolve(here, "../../../../.env"));
  return Array.from(paths);
}

export interface LoadDotenvResult {
  loadedFrom: string | null;
  keysLoaded: string[];
}

export function loadDotenv(
  candidates: string[] = candidatePaths()
): LoadDotenvResult {
  let loadedFrom: string | null = null;
  const merged: Record<string, string> = {};
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      const contents = readFileSync(path, "utf8");
      Object.assign(merged, parseDotenv(contents));
      if (loadedFrom === null) loadedFrom = path;
    } catch {
      // ignore unreadable .env; loadDotenv must never crash the server.
    }
  }
  const keysLoaded: string[] = [];
  for (const [key, value] of Object.entries(merged)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
      keysLoaded.push(key);
    }
  }
  return { loadedFrom, keysLoaded };
}