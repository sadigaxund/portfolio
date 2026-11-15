import { defineConfig } from "@playwright/test";

const port = 4321;

export default defineConfig({
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    browserName: "chromium",
  },
  projects: [
    { name: "desktop", testDir: "tests/e2e", use: { viewport: { width: 1280, height: 800 } } },
    { name: "phone", testDir: "tests/e2e", use: { viewport: { width: 360, height: 740 } } },
    // Unit tests and the markii conformance run use no page, so no browser opens.
    { name: "node", testDir: "tests/node" },
  ],
  webServer: {
    command: `npx astro preview --ignore-lock --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
  },
});
