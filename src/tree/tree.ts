import siteData from "../../content/site.yaml";
import { parseTree } from "./schema";

/** Direction of a branch at the fork: left, straight on, or right. */
export type Direction = -1 | 0 | 1;

/** A node with children is a subsection, and a node without is a leaf. Both may share a level. */
export interface NodeSpec {
  slug: string;
  label: string;
  /** One line under a section's heading. Sections only. */
  summary?: string;
  /** One line under a leaf's name on its parent. Leaves only. */
  preview?: string;
  children?: NodeSpec[];
}

/** Where a road leaves the fork. Only the root's children carry one. */
export type Side = "left" | "straight" | "right";

export interface RoadSpec extends NodeSpec {
  side: Side;
}

/** The root is the landing page. Its children are the roads at the fork. */
export interface TreeSpec {
  label: string;
  children: RoadSpec[];
}

/** Every node of the site, read from `content/site.yaml`. A node's URL is its parent's URL plus its slug. */
export const TREE: TreeSpec = parseTree(siteData);
