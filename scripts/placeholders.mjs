import { listFiles, readLines } from "./lib/source.mjs";

// Lists every PLACEHOLDER left in the site. With --strict, any found fails the run, for launch.
const strict = process.argv.includes("--strict");
const found = [];

for (const file of listFiles(["src"])) {
  readLines(file).forEach((line, index) => {
    if (line.includes("PLACEHOLDER")) found.push(`${file}:${index + 1}: ${line.trim()}`);
  });
}

for (const entry of found) console.log(entry);
console.log(`${found.length} PLACEHOLDER lines`);
process.exit(strict && found.length > 0 ? 1 : 0);
