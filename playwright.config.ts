import { defineConfig } from "@playwright/test";

const e2ePort = Number.parseInt(process.env.SOFER_E2E_PORT ?? "5173", 10);
if (!Number.isInteger(e2ePort) || e2ePort < 1024 || e2ePort > 65535) {
  throw new Error("SOFER_E2E_PORT must be a TCP port between 1024 and 65535");
}
const e2eUrl = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: e2eUrl,
    headless: true,
    trace: "off",
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    // Start the dev server (Vite) for the test run.
    command: `npm --prefix client run dev -- --host 127.0.0.1 --port ${e2ePort}`,
    url: e2eUrl,
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
