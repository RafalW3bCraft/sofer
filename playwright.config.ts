import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    trace: "off",
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    // Start the dev server (Vite) for the test run.
    command: "npm run dev:client",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});