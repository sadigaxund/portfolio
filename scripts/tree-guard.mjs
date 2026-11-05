import { listFiles, readLines } from "./lib/source.mjs";

// The line engine stays free of node-specific logic, so no slug from the tree may appear in it.
const treeText = readLines("src/tree/tree.ts").join("\n");
const slugs = [...treeText.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);
if (slugs.length === 0) {
  console.error("tree guard: found no slugs in src/tree/tree.ts");
  process.exit(1);
}

const failures = [];
for (const file of listFiles(["src/line"])) {
  readLines(file).forEach((line, index) => {
    for (const slug of slugs) {
      if (line.includes(`"${slug}"`) || line.includes(`'${slug}'`) || line.includes(`\`${slug}\``) || line.includes(`/${slug}`)) {
        failures.push(`${file}:${index + 1}: names the tree node "${slug}"`);
      }
    }
  });
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  console.error(`tree guard: ${failures.length} problem(s)`);
  process.exit(1);
}
console.log(`tree guard: ok, ${slugs.length} slugs`);
