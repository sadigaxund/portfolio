import { defineConfig } from "@playwright/test";

// GitHub Pages serves the site under /portfolio, so this run builds and serves it there.
const port = 4322;
const base = "/portfolio";
const env = `BASE_PATH=${base}`;

export default defineConfig({
  reporter: "list",
  testDir: "tests/base",
  use: { baseURL: `http://localhost:${port}`, browserName: "chromium" },
  webServer: {
    command: `${env} npx astro build --outDir dist-base && ${env} npx astro preview --outDir dist-base --ignore-lock --port ${port}`,
    url: `http://localhost:${port}${base}/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
