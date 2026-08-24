import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";

const frontendDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendDirectory = path.resolve(frontendDirectory, "../backend");

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/pwa.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  reporter: "line",
  outputDir: "test-results-pwa",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:3001",
    launchOptions: { args: ["--disable-web-security"] },
    serviceWorkers: "allow",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: [
    {
      command: "uv run uvicorn app.main:app --host 127.0.0.1 --port 8000",
      cwd: backendDirectory,
      env: {
        UV_CACHE_DIR: "/private/tmp/claimsaathi-uv-cache",
        AI_ENABLED: "false",
        OPENAI_API_KEY: "",
      },
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "npm run start -- --hostname 127.0.0.1 --port 3001",
      cwd: frontendDirectory,
      url: "http://localhost:3001",
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
