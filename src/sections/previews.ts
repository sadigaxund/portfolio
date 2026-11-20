import type { TreeNode } from "../tree/walk";

/** What a section with no pages left says, on its page and as its preview. */
export const EMPTY_SECTION = "Nothing here yet.";

/** What a signpost or stop says is down its road: the children's names, or the leaf's own line. */
export function previewOf(node: TreeNode): string | undefined {
  if (node.children.length > 0) return node.children.map((child) => child.label).join(", ");
  return node.section ? EMPTY_SECTION : node.preview;
}

/** A section's one-line summary, from `content/site.yaml`. */
export function summaryOf(node: TreeNode): string | undefined {
  return node.summary;
}
