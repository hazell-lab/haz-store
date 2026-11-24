import { defineConfig, devices } from "@playwright/test";

const PORT = 4174;
// on ci, playwright downloads its own chromium; locally the installed chrome is used
const channel = process.env.CI ? undefined : "chrome";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: "http://localhost:" + PORT,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel } },
  ],
  // tests run against the production build
  webServer: {
    command: "npm run build && npm run preview -- --port " + PORT + " --strictPort",
    url: "http://localhost:" + PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
