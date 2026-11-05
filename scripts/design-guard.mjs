import { extname } from "node:path";
import { classify, listFiles, readLines } from "./lib/source.mjs";

// Class names are delimited by anything that is not a word character or a hyphen.
const EDGE_BEFORE = String.raw`(?<![\w-])`;
const EDGE_AFTER = String.raw`(?![\w-])`;
const HEX = "[0-9a-fA-F]";

const RULES = [
  {
    name: "raw text size",
    pattern: new RegExp(`${EDGE_BEFORE}text-(?:xs|sm|base|lg|xl|[2-9]xl)${EDGE_AFTER}`, "g"),
  },
  {
    name: "raw font weight",
    pattern: new RegExp(
      `${EDGE_BEFORE}font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)${EDGE_AFTER}`,
      "g",
    ),
  },
  { name: "arbitrary Tailwind value", pattern: /[\w:!/.-]*\w-\[[^\]]+\]/g },
  {
    name: "arbitrary Tailwind property",
    pattern: /(?<=^|[\s"'`])!?\[[a-z-]+:[^\]\s]+\]/g,
  },
  {
    name: "hex color",
    pattern: new RegExp(`(?<![\\w&])#(?:${HEX}{8}|${HEX}{6}|${HEX}{4}|${HEX}{3})(?![\\w])`, "g"),
    skip: (text, at) => /(?:href|to)=\{?["']$/.test(text.slice(0, at)),
  },
  { name: "color function", pattern: /(?<![\w-])(?:rgba?|hsla?|oklch)\(/g },
  {
    name: "native control outside src/ui",
    pattern: /<(?:button|input|select|textarea|table)(?![\w-])/g,
    onlyOutside: "src/ui/",
  },
  { name: "inline font size", pattern: /\bfontSize\b|\bfont-size\b/g },
];

const failures = [];
const files = listFiles(["src"], (rel) => rel.startsWith("src/styles/"));

for (const file of files) {
  const entries = classify(readLines(file), extname(file));
  entries.forEach(({ code }, index) => {
    for (const rule of RULES) {
      if (rule.onlyOutside && file.startsWith(rule.onlyOutside)) continue;
      for (const match of code.matchAll(rule.pattern)) {
        if (rule.skip?.(code, match.index)) continue;
        failures.push(`${file}:${index + 1}: ${rule.name}: ${match[0]}`);
      }
    }
  });
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  console.error(`design guard: ${failures.length} problem(s)`);
  process.exit(1);
}
console.log("design guard: ok");
