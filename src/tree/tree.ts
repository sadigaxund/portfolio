import siteData from "../../content/site.yaml";
import { hideDrafts, hidesDrafts, hiddenRoutes } from "./drafts";
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
  /** A repository's star count, such as 200+, shown with a star before the preview. Leaves only. */
  stars?: string;
  /** A still image beside a leaf's name on its parent, as a path inside `content/`. Leaves only. */
  thumb?: string;
  children?: NodeSpec[];
  /** True while the node holds placeholder content. A build with `SITE_DRAFTS=hide` leaves it out. */
  draft?: true;
}

/** Where a road leaves the fork. Only the root's children carry one. */
export type Side = "left" | "straight" | "right";

/** A road's line color in each color scheme, as #rrggbb. */
export interface RoadColor {
  light: string;
  dark: string;
}

export interface RoadSpec extends NodeSpec {
  side: Side;
  color: RoadColor;
}

/** The root is the landing page. Its children are the roads at the fork. */
export interface TreeSpec {
  label: string;
  children: RoadSpec[];
}

/** Every node of the site, read from `content/site.yaml`. A node's URL is its parent's URL plus its slug. */
const FULL: TreeSpec = parseTree(siteData);
const HIDE = hidesDrafts(__SITE_DRAFTS__);
export const TREE: TreeSpec = HIDE ? hideDrafts(FULL) : FULL;
/** Routes left out of this build, so their notes are not reported as orphans. */
export const HIDDEN_ROUTES: readonly string[] = HIDE ? hiddenRoutes(FULL) : [];
