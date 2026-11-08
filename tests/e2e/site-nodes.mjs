import { readFileSync } from "node:fs";

/**
 * Reads every node's URL and label from content/site.yaml. Playwright cannot import YAML, so this scans the file by indent.
 * @returns {{ url: string, label: string }[]}
 */
export function siteNodes() {
  const lines = readFileSync("content/site.yaml", "utf8").split("\n");
  const rootLabel = lines.find((line) => line.startsWith("label:"))?.slice(6).trim() ?? "";
  const nodes = [{ url: "/", label: rootLabel }];
  const stack = [];
  let current;
  for (const line of lines) {
    const slug = line.match(/^(\s*)-\s+slug:\s*(\S+)\s*$/);
    if (slug) {
      const indent = slug[1].length;
      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) stack.pop();
      const url = `${stack.length > 0 ? stack[stack.length - 1].url : ""}/${slug[2]}`;
      current = { indent, url };
      stack.push(current);
      continue;
    }
    const label = line.match(/^\s+label:\s*(.+?)\s*$/);
    if (label && current && !nodes.some((node) => node.url === current.url)) nodes.push({ url: current.url, label: label[1] });
  }
  return nodes;
}
