import { extname } from "node:path";
import { classify, listFiles, readLines } from "./lib/source.mjs";

const MAX_FILE_LINES = 250;
const MAX_COMMENT_BLOCK = 12;
const MAX_COMMENT_RATIO = 0.5;

const failures = [];
const fail = (file, line, message) => failures.push(`${file}:${line}: ${message}`);

for (const file of listFiles(["src", "scripts"])) {
  const lines = readLines(file);
  if (lines.length > MAX_FILE_LINES) {
    fail(file, MAX_FILE_LINES + 1, `file has ${lines.length} lines, limit is ${MAX_FILE_LINES}`);
  }

  const kinds = classify(lines, extname(file)).map((entry) => entry.kind);
  let comments = 0;
  let codeLines = 0;
  let run = 0;
  const closeRun = (end) => {
    if (run > MAX_COMMENT_BLOCK) {
      fail(file, end - run + 1, `comment block has ${run} lines, limit is ${MAX_COMMENT_BLOCK}`);
    }
    run = 0;
  };
  kinds.forEach((kind, index) => {
    if (kind === "comment") {
      comments += 1;
      run += 1;
    } else {
      closeRun(index);
      if (kind === "code") codeLines += 1;
    }
  });
  closeRun(kinds.length);

  if (comments > 0 && (codeLines === 0 || comments / codeLines > MAX_COMMENT_RATIO)) {
    const ratio = codeLines === 0 ? "no code lines" : (comments / codeLines).toFixed(2);
    fail(file, 1, `comment to code ratio is ${ratio}, limit is ${MAX_COMMENT_RATIO}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  console.error(`shape guard: ${failures.length} problem(s)`);
  process.exit(1);
}
console.log("shape guard: ok");
