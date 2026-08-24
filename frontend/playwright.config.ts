import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";

const frontendDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendDirectory = path.resolve(frontendDirectory, "../backend");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "line",
  outputDir: "test-results",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "uv run uvicorn app.main:app --host 127.0.0.1 --port 8000",
      cwd: backendDirectory,
      env: {
        UV_CACHE_DIR: "/private/tmp/claimsaathi-uv-cache",
        CLAIMSAATHI_AI_ENABLED: "false",
        OPENAI_API_KEY: "",
      },
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
      cwd: frontendDirectory,
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 90_000,
    },
  ],
});
