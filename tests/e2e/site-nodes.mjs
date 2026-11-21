import { existsSync, readFileSync } from "node:fs";
import { load } from "js-yaml";

function opensWithOtherHeading(url, label) {
  const file = [".mk.md", ".md"].map((ext) => `content${url}${ext}`).find((path) => existsSync(path));
  const heading = file && /^# (.+)$/m.exec(readFileSync(file, "utf8"));
  return Boolean(heading) && heading[1] !== label;
}

/**
 * Every node's URL and label in content/site.yaml, parsed by the same YAML library the build uses.
 * `ownHeading` marks a leaf whose note opens with a heading that differs from the node's label.
 * @returns {{ url: string, label: string, ownHeading: boolean }[]}
 */
export function siteNodes() {
  const root = load(readFileSync("content/site.yaml", "utf8"));
  const nodes = [{ url: "/", label: root.label, ownHeading: false }];
  const walk = (children, prefix) => {
    for (const child of children ?? []) {
      const url = `${prefix}/${child.slug}`;
      nodes.push({ url, label: child.label, ownHeading: opensWithOtherHeading(url, child.label) });
      walk(child.children, url);
    }
  };
  walk(root.children, "");
  return nodes;
}

/**
 * The roads at the fork, with their side and line colors, from content/site.yaml.
 * @returns {{ slug: string, side: string, color: { light: string, dark: string } }[]}
 */
export function siteRoads() {
  return load(readFileSync("content/site.yaml", "utf8")).children;
}
