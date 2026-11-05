import { TREE, type BranchSpec, type Direction } from "./tree";

export interface TreeNode {
  url: string;
  label: string;
  parent: TreeNode | null;
  children: TreeNode[];
  /** The branch walked to reach this node. Null at the root. */
  direction: Direction | null;
}

function buildBranch(spec: BranchSpec, direction: Direction, root: TreeNode): TreeNode {
  const url = `/${spec.slug}`;
  const branch: TreeNode = { url, label: spec.label, parent: root, children: [], direction };
  branch.children = spec.leaves.map((leaf) => ({
    url: `${url}/${leaf.slug}`,
    label: leaf.label,
    parent: branch,
    children: [],
    direction,
  }));
  return branch;
}

export const ROOT: TreeNode = { url: "/", label: TREE.label, parent: null, children: [], direction: null };

/** The fork's branches, ordered left to right. */
export const BRANCHES: readonly (TreeNode & { direction: Direction })[] = [
  buildBranch(TREE.left, -1, ROOT),
  buildBranch(TREE.straight, 0, ROOT),
  buildBranch(TREE.right, 1, ROOT),
] as (TreeNode & { direction: Direction })[];
ROOT.children = [...BRANCHES];

export const ALL_NODES: readonly TreeNode[] = [ROOT, ...BRANCHES.flatMap((branch) => [branch, ...branch.children])];

const BY_URL = new Map(ALL_NODES.map((node) => [node.url, node]));

/** Finds the node for a pathname, ignoring a trailing slash. */
export function nodeAt(path: string): TreeNode | undefined {
  return BY_URL.get(path.length > 1 ? path.replace(/\/$/, "") : path);
}

/** A leaf is a node past the root with nothing below it. It owns the whole screen. */
export function isLeaf(node: TreeNode): boolean {
  return node.parent !== null && node.children.length === 0;
}

export function isLeafPath(path: string): boolean {
  const node = nodeAt(path);
  return node !== undefined && isLeaf(node);
}
