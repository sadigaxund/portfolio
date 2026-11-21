import type { NodeSpec, RoadSpec, TreeSpec } from "./tree";

/** Drafts are hidden only when the build sets `SITE_DRAFTS=hide`. Unset, the whole tree shows. */
export const hidesDrafts = (env: string | undefined): boolean => env === "hide";

/** A section with children is hidden once every child is hidden. A leaf is hidden by its own flag. */
function isHidden(node: NodeSpec): boolean {
  if (node.draft) return true;
  return node.children !== undefined && node.children.every(isHidden);
}

function prune<T extends NodeSpec>(node: T): T {
  if (node.children === undefined) return node;
  return { ...node, children: node.children.filter((child) => !isHidden(child)).map(prune) };
}

/** The tree without drafts and without the sections they leave empty. A road stays unless it is a draft itself, so the fork keeps its three roads. */
export function hideDrafts(tree: TreeSpec): TreeSpec {
  const roads: RoadSpec[] = tree.children.filter((road) => !road.draft).map(prune);
  return { ...tree, children: roads };
}

/** The URL paths, such as `personal/gym`, that `hideDrafts` removes. Their notes are skipped by the content check. */
export function hiddenRoutes(tree: TreeSpec): string[] {
  const out: string[] = [];
  const walk = (node: NodeSpec, prefix: string) => {
    const route = `${prefix}${node.slug}`;
    const hidden = prefix === "" ? Boolean(node.draft) : isHidden(node);
    if (hidden) out.push(route);
    else (node.children ?? []).forEach((child) => walk(child, `${route}/`));
  };
  tree.children.forEach((road) => walk(road, ""));
  return out;
}
