import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import yaml from "@rollup/plugin-yaml";

export default defineConfig({
  output: "static",
  // The deploy workflow sets these for a host that serves the site under a subpath.
  site: process.env.SITE_ORIGIN || undefined,
  base: process.env.BASE_PATH || undefined,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss(), yaml()],
  },
});
