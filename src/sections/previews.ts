import type { TreeNode } from "../tree/walk";

/** What a signpost or stop says is down its road: the children's names, or the leaf's own line. */
export function previewOf(node: TreeNode): string | undefined {
  if (node.children.length > 0) return node.children.map((child) => child.label).join(", ");
  return node.preview;
}

/** A section's one-line summary, from `content/site.yaml`. */
export function summaryOf(node: TreeNode): string | undefined {
  return node.summary;
}
