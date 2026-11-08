import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { listFiles, readLines, root } from "./lib/source.mjs";

// Lists every PLACEHOLDER left in the site. With --strict, any found fails the run, for launch.
const strict = process.argv.includes("--strict");
const found = [];

/** Every file under content/, which holds the map and the notes. */
function contentFiles(dir = join(root, "content")) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? contentFiles(join(dir, entry.name)) : [relative(root, join(dir, entry.name))],
  );
}

for (const file of [...listFiles(["src"]), ...contentFiles()]) {
  readLines(file).forEach((line, index) => {
    if (line.includes("PLACEHOLDER")) found.push(`${file}:${index + 1}: ${line.trim()}`);
  });
}

for (const entry of found) console.log(entry);
console.log(`${found.length} PLACEHOLDER lines`);
process.exit(strict && found.length > 0 ? 1 : 0);
