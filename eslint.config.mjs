import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";

export default tseslint.config(
  { ignores: ["dist/", "dist-base/", ".astro/", "node_modules/", "test-results/", "playwright-report/", "markii/packs/"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  {
    languageOptions: {
      globals: { process: "readonly", console: "readonly", URL: "readonly" },
    },
    rules: {
      "max-lines-per-function": ["error", { max: 150, skipBlankLines: false, skipComments: false }],
    },
  },
);
