import { TREE, type Direction, type NodeSpec } from "./tree";

export interface TreeNode {
  url: string;
  label: string;
  parent: TreeNode | null;
  children: TreeNode[];
  /** The branch walked to reach this node. Null at the root. */
  direction: Direction | null;
}

function buildNode(spec: NodeSpec, parent: TreeNode, direction: Direction): TreeNode {
  const prefix = parent.url === "/" ? "" : parent.url;
  const node: TreeNode = { url: `${prefix}/${spec.slug}`, label: spec.label, parent, children: [], direction };
  node.children = (spec.children ?? []).map((child) => buildNode(child, node, direction));
  return node;
}

function withDescendants(node: TreeNode): TreeNode[] {
  return [node, ...node.children.flatMap(withDescendants)];
}

export const ROOT: TreeNode = { url: "/", label: TREE.label, parent: null, children: [], direction: null };

/** The fork's branches, ordered left to right. */
export const BRANCHES = [
  { ...buildNode(TREE.left, ROOT, -1), direction: -1 as const },
  { ...buildNode(TREE.straight, ROOT, 0), direction: 0 as const },
  { ...buildNode(TREE.right, ROOT, 1), direction: 1 as const },
];
ROOT.children = BRANCHES;
for (const branch of BRANCHES) for (const child of branch.children) child.parent = branch;

export const ALL_NODES: readonly TreeNode[] = withDescendants(ROOT);

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
