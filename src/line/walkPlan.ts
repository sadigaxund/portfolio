import type { TreeNode } from "../tree/walk";

export type Step = { kind: "down" | "up"; node: TreeNode };

/** The nodes from the top of the line down to a node. A leaf rests on its parent's line. */
export function linePathOf(node: TreeNode | undefined): TreeNode[] {
  const path: TreeNode[] = [];
  for (let at = node; at?.parent; at = at.parent) {
    if (at.children.length > 0) path.unshift(at);
  }
  return path;
}

/** The moves that walk the line from one path to another, through their shared part. */
export function planWalk(from: TreeNode[], to: TreeNode[]): Step[] {
  let shared = 0;
  while (shared < from.length && shared < to.length && from[shared] === to[shared]) shared += 1;
  const ups = from.slice(shared).reverse().map((node): Step => ({ kind: "up", node }));
  const downs = to.slice(shared).map((node): Step => ({ kind: "down", node }));
  return [...ups, ...downs];
}
