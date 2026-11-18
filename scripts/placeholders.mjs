import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import { hiddenRoutes, hideDrafts, hidesDrafts } from "../src/tree/drafts.ts";
import { listFiles, readLines, root } from "./lib/source.mjs";

// Lists every PLACEHOLDER left in the site. With --strict, any found fails the run, for launch.
const strict = process.argv.includes("--strict");
const found = [];

// A build with SITE_DRAFTS=hide leaves drafts out, so their placeholders do not count.
const hide = hidesDrafts(process.env.SITE_DRAFTS);
const full = load(readFileSync(join(root, "content/site.yaml"), "utf8"));
const hidden = hide ? hiddenRoutes(full) : [];
const isHiddenNote = (file) => hidden.some((route) => file.startsWith(`content/${route}.`) || file.startsWith(`content/${route}/`));

/** Every file under content/, which holds the map and the notes. */
function contentFiles(dir = join(root, "content")) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? contentFiles(join(dir, entry.name)) : [relative(root, join(dir, entry.name))],
  );
}

for (const file of [...listFiles(["src"]), ...contentFiles()]) {
  if (isHiddenNote(file)) continue;
  // The map is checked as the tree the build keeps, not as raw lines.
  const lines = file === "content/site.yaml" && hide ? JSON.stringify(hideDrafts(full), null, 1).split("\n") : readLines(file);
  lines.forEach((line, index) => {
    if (line.includes("PLACEHOLDER")) found.push(`${file}:${index + 1}: ${line.trim()}`);
  });
}

for (const entry of found) console.log(entry);
console.log(`${found.length} PLACEHOLDER lines`);
process.exit(strict && found.length > 0 ? 1 : 0);
