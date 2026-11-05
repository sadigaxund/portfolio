import { defineConfig } from "@playwright/test";

const port = 4321;

export default defineConfig({
  testDir: "tests/e2e",
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    browserName: "chromium",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    { name: "phone", use: { viewport: { width: 360, height: 740 } } },
  ],
  webServer: {
    command: `npx astro preview --ignore-lock --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
  },
});
