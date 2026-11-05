import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { root } from "./source.mjs";

const TOKENS = ["--color-primary", "--color-bg", "--color-fg", "--duration-slow", "--ease-out"];

function tokenValue(css, name) {
  const match = css.match(new RegExp(`^\\s*${name}:\\s*([^;]+);`, "m"));
  if (!match) throw new Error(`token ${name} not found in my-you-eye tokens.css`);
  return match[1].trim();
}

/** Builds a copy of the site with no my-you-eye CSS or JS. The working tree is never touched. */
export function buildWithoutLibrary(work) {
  const site = join(work, "nolib");
  rmSync(site, { recursive: true, force: true });
  mkdirSync(site, { recursive: true });
  for (const entry of ["package.json", "astro.config.mjs", "tsconfig.json"]) cpSync(join(root, entry), join(site, entry));
  cpSync(join(root, "src"), join(site, "src"), { recursive: true });
  symlinkSync(join(root, "node_modules"), join(site, "node_modules"));
  rmSync(join(site, "src/pages/index.astro"));
  rmSync(join(site, "src/ui"), { recursive: true, force: true });

  const tokens = readFileSync(join(root, "node_modules/my-you-eye/dist/tokens.css"), "utf8");
  const declarations = TOKENS.map((name) => `  ${name}: ${tokenValue(tokens, name)};`).join("\n");
  writeFileSync(
    join(site, "src/styles/global.css"),
    `@import "tailwindcss";\n:root {\n${declarations}\n  background-color: var(--color-bg);\n  color: var(--color-fg);\n}\n`,
  );
  const stage = join(site, "src/line/LineStage.tsx");
  const source = readFileSync(stage, "utf8")
    .replace(/import \{ Link \} from "my-you-eye";\n/, "")
    .replace(/<Link /g, "<a ")
    .replace(/<\/Link>/g, "</a>");
  writeFileSync(stage, source);

  const build = spawnSync(process.execPath, [join(root, "node_modules/astro/bin/astro.mjs"), "build"], {
    cwd: site,
    encoding: "utf8",
  });
  if (build.status !== 0) throw new Error(`variant build failed:\n${build.stdout}\n${build.stderr}`);
  const dist = join(site, "dist");
  // The variant is only a valid control if the library left no trace in it.
  const files = readdirSync(join(dist, "_astro")).map((name) => join(dist, "_astro", name));
  const leaked = files.filter((file) => /my-you-eye|Plus Jakarta|@font-face|data-slot/.test(readFileSync(file, "utf8")));
  const html = readFileSync(join(dist, "index.html"), "utf8");
  if (leaked.length > 0 || /Plus Jakarta|@font-face/.test(html)) {
    throw new Error(`library code found in the no-library build: ${leaked.join(", ")}`);
  }
  const bytes = files.reduce((sum, file) => sum + statSync(file).size, 0);
  return { dist, bytes };
}

export function builtSize(dist) {
  const dir = join(dist, "_astro");
  if (!existsSync(dir)) throw new Error(`${dist} has no _astro folder. Run npm run build first.`);
  return readdirSync(dir).reduce((sum, name) => sum + statSync(join(dir, name)).size, 0);
}

const click = (page) => page.getByRole("link", { name: "Projects" }).click();

// Page code travels as strings, so this file needs no browser globals.
const synthetic = (page) =>
  page.evaluate(`(() => {
    const event = new Event("astro:before-preparation");
    event.to = new URL("/projects-blog", location.href);
    document.dispatchEvent(event);
  })()`);

const warm = (page) => page.evaluate(`fetch("/projects-blog").then((r) => r.text())`);

/** Each variant names its build, optional injected CSS, an optional warm-up, and how it starts the transition. */
export const VARIANTS = {
  A: { label: "A baseline", build: "dist", trigger: click },
  W: { label: "A warm cache", build: "dist", prepare: warm, trigger: click },
  B: { label: "B no library", build: "nolib", trigger: click },
  C: { label: "C no route change", build: "dist", trigger: synthetic },
  D: {
    label: "D will-change",
    build: "dist",
    css: ".line-world { will-change: transform; }",
    trigger: click,
  },
  E: {
    label: "E short page",
    build: "dist",
    css: ".line-content > div { display: none; } html, body { height: 100vh; overflow: clip; }",
    trigger: click,
  },
};
