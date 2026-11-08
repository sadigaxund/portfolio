import { readFileSync } from "node:fs";
import { load } from "js-yaml";

/**
 * Every node's URL and label in content/site.yaml, parsed by the same YAML library the build uses.
 * @returns {{ url: string, label: string }[]}
 */
export function siteNodes() {
  const root = load(readFileSync("content/site.yaml", "utf8"));
  const nodes = [{ url: "/", label: root.label }];
  const walk = (children, prefix) => {
    for (const child of children ?? []) {
      const url = `${prefix}/${child.slug}`;
      nodes.push({ url, label: child.label });
      walk(child.children, url);
    }
  };
  walk(root.children, "");
  return nodes;
}
