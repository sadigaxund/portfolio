import { existsSync, readFileSync } from "node:fs";
import { load } from "js-yaml";

/**
 * Every node's URL and label in content/site.yaml, parsed by the same YAML library the build uses.
 * `remote` marks a leaf whose note is downloaded, so its heading is the note's own.
 * @returns {{ url: string, label: string, remote: boolean }[]}
 */
export function siteNodes() {
  const root = load(readFileSync("content/site.yaml", "utf8"));
  const nodes = [{ url: "/", label: root.label, remote: false }];
  const walk = (children, prefix) => {
    for (const child of children ?? []) {
      const url = `${prefix}/${child.slug}`;
      nodes.push({ url, label: child.label, remote: existsSync(`content${url}.remote.yaml`) });
      walk(child.children, url);
    }
  };
  walk(root.children, "");
  return nodes;
}
