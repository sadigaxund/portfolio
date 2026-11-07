import { routeParam, type TreeNode } from "../tree/walk";

/** A leaf may export a one-line preview from `meta.ts` in its own folder. */
const METAS = import.meta.glob<{ preview?: string }>("./**/meta.ts", { eager: true });

/** What a signpost or stop says is down its road: the children's names, or the leaf's own line. */
export function previewOf(node: TreeNode): string | undefined {
  if (node.children.length > 0) return node.children.map((child) => child.label).join(", ");
  return METAS[`./${routeParam(node)}/meta.ts`]?.preview;
}
