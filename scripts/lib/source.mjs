import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

export const root = new URL("../..", new URL(".", import.meta.url)).pathname;
export const EXTENSIONS = new Set([".ts", ".tsx", ".astro", ".mjs", ".js", ".css"]);

/** Lists source files under the given folders, relative to the repo root. */
export function listFiles(folders, skip = () => false) {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (EXTENSIONS.has(extname(entry.name))) {
        const rel = relative(root, full);
        if (!skip(rel)) found.push(rel);
      }
    }
  };
  for (const folder of folders) {
    try {
      walk(join(root, folder));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  // A guard that scans nothing must go red, because its "ok" would mean nothing.
  if (found.length === 0) {
    console.error(`guard: no source files found under ${folders.join(", ")}`);
    process.exit(1);
  }
  return found.sort();
}

export function readLines(rel) {
  const lines = readFileSync(join(root, rel), "utf8").split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

/**
 * Splits each line into kind (blank, comment, code) and its code text
 * with comments removed. Quotes are tracked for script files only.
 */
export function classify(lines, ext) {
  const isCss = ext === ".css";
  const trackQuotes = ext !== ".astro" && !isCss;
  let closer = null;
  return lines.map((raw) => {
    const startedInBlock = closer !== null;
    let code = "";
    let sawComment = startedInBlock;
    let quote = null;
    for (let i = 0; i < raw.length; i++) {
      const rest = raw.slice(i);
      if (closer) {
        const end = raw.indexOf(closer, i);
        if (end === -1) break;
        i = end + closer.length - 1;
        closer = null;
        continue;
      }
      const ch = raw[i];
      if (quote) {
        if (ch === "\\") code += raw[i++] ?? "";
        else if (ch === quote) quote = null;
        code += ch;
        continue;
      }
      if (rest.startsWith("/*")) closer = "*/";
      else if (ext === ".astro" && rest.startsWith("<!--")) closer = "-->";
      else if (!isCss && rest.startsWith("//") && (i === 0 || /\s/.test(raw[i - 1]))) {
        sawComment = true;
        break;
      }
      if (closer) {
        sawComment = true;
        i += 1;
        continue;
      }
      if (trackQuotes && "'\"`".includes(ch)) quote = ch;
      code += ch;
    }
    let kind = "code";
    if (code.trim() === "") kind = sawComment ? "comment" : "blank";
    return { kind, code };
  });
}
