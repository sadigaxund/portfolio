import { TREE, type Direction, type Side } from "./tree";
import type { TreeNode } from "./walk";

const SIDE_OF: Record<Direction, Side> = { [-1]: "left", 0: "straight", 1: "right" };

/** The road a page sits on, named by its side of the fork. Undefined at the root. */
export function roadOf(node: TreeNode): Side | undefined {
  return node.direction === null ? undefined : SIDE_OF[node.direction];
}

/**
 * Each road's color as a custom property, such as `--road-left`, from `content/site.yaml`.
 * Stylesheets read only these names, so a road's color lives in the data and nowhere else.
 */
export function roadColorCss(): string {
  const props = (scheme: "light" | "dark") => TREE.children.map((road) => `--road-${road.side}: ${road.color[scheme]};`).join(" ");
  return `:root { ${props("light")} } @media (prefers-color-scheme: dark) { :root { ${props("dark")} } }`;
}
