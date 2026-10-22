#!/usr/bin/env node
/**
 * Build helper: compile server TS to dist/index.js using esbuild, and copy
 * the shared schemas into dist/shared/. The server source uses `.js` import
 * paths (Node ESM convention) so the compiled output resolves them at runtime;
 * esbuild's bundler mode also resolves them at compile time.
 */
import { build } from "esbuild";
import { mkdir, copyFile, readdir, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "dist");

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

// Compile server source.
await build({
  entryPoints: ["index.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  outfile: "dist/index.js",
  packages: "external",
  sourcemap: true,
  loader: { ".js": "ts" },
});

// Compile shared schemas to JS as well so the compiled server can import
// `../../shared/schemas.js` at runtime.
await build({
  entryPoints: ["../shared/schemas.ts"],
  bundle: false,
  format: "esm",
  platform: "node",
  target: "node20",
  outfile: "dist/shared/schemas.js",
  packages: "external",
  sourcemap: false,
  loader: { ".ts": "ts" },
});

console.log("server build complete: dist/index.js + dist/shared/schemas.js");