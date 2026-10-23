import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("loadDotenv", () => {
  const ORIGINAL_ENV = { ...process.env };
  let workdir = "";

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in ORIGINAL_ENV)) delete process.env[key];
    }
    for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
      process.env[key] = value;
    }
    if (workdir) {
      rmSync(workdir, { recursive: true, force: true });
      workdir = "";
    }
    vi.resetModules();
  });

  it("loads key=value pairs from a .env file", async () => {
    workdir = mkdtempSync(join(tmpdir(), "sofer-dotenv-"));
    writeFileSync(
      join(workdir, ".env"),
      "TOKENFACTORY_API_KEY=abc123\nTOKENFACTORY_MODEL=mock-model\n# comment line\n\nQUOTED=\"some value\"\n"
    );
    vi.resetModules();
    const { loadDotenv } = await import("../../server/lib/env");
    delete process.env.TOKENFACTORY_API_KEY;
    delete process.env.TOKENFACTORY_MODEL;
    const r = loadDotenv([join(workdir, ".env")]);
    expect(r.loadedFrom).toBe(join(workdir, ".env"));
    expect(process.env.TOKENFACTORY_API_KEY).toBe("abc123");
    expect(process.env.TOKENFACTORY_MODEL).toBe("mock-model");
    expect(process.env.QUOTED).toBe("some value");
  });

  it("does not overwrite an env var that is already set", async () => {
    workdir = mkdtempSync(join(tmpdir(), "sofer-dotenv-"));
    writeFileSync(
      join(workdir, ".env"),
      "TOKENFACTORY_API_KEY=from-file\nTOKENFACTORY_MODEL=from-file\n"
    );
    vi.resetModules();
    const { loadDotenv } = await import("../../server/lib/env");
    process.env.TOKENFACTORY_API_KEY = "from-env";
    delete process.env.TOKENFACTORY_MODEL;
    loadDotenv([join(workdir, ".env")]);
    expect(process.env.TOKENFACTORY_API_KEY).toBe("from-env");
    expect(process.env.TOKENFACTORY_MODEL).toBe("from-file");
  });

  it("strips inline # comments after whitespace", async () => {
    workdir = mkdtempSync(join(tmpdir(), "sofer-dotenv-"));
    writeFileSync(
      join(workdir, ".env"),
      "TOKENFACTORY_MODEL=foo # this is a comment\n"
    );
    vi.resetModules();
    const { loadDotenv } = await import("../../server/lib/env");
    delete process.env.TOKENFACTORY_MODEL;
    loadDotenv([join(workdir, ".env")]);
    expect(process.env.TOKENFACTORY_MODEL).toBe("foo");
  });

  it("does not crash when no candidate path exists", async () => {
    vi.resetModules();
    const { loadDotenv } = await import("../../server/lib/env");
    const r = loadDotenv(["/nonexistent/.env-path-" + Date.now()]);
    expect(r.loadedFrom).toBeNull();
    expect(r.keysLoaded).toEqual([]);
  });
});