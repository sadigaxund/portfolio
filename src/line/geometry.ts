import type { Direction } from "../tree/tree";

export const DIRECTIONS: readonly Direction[] = [-1, 0, 1];

export interface Measure {
  centerX: number;
  forkY: number;
  spread: number;
  stem: number;
  /** Height of the page the line runs through. */
  height: number;
  /** How far the fork travels upward once a branch is chosen. */
  lift: number;
  /** A stop's straight branch length, and the radius of its bends. */
  reach: number;
  drop: number;
  /** From the top of a run to its first stop, and between stops. */
  firstStop: number;
  stopGap: number;
  bothSides: boolean;
}

/** How long a branch stub runs below the fork, as a multiple of the stem. */
export const STUB_RATIO = 1.5;

/** The branch curve, in the fork SVG's own coordinates, where the fork sits at x = spread, y = 0. */
export function branchPath(spread: number, stem: number, direction: Direction): string {
  const exitX = spread + direction * spread;
  const control = stem / 2;
  const curve = `C ${spread} ${control} ${exitX} ${control} ${exitX} ${stem}`;
  return `M ${spread} 0 ${curve} L ${exitX} ${stem * STUB_RATIO}`;
}

/** Unchosen branches retract in step with the choice. The chosen one stays drawn. */
export function retraction(chosen: Direction | null, direction: Direction, progress: number): number {
  return chosen === null || chosen === direction ? 0 : progress;
}

/** Fork labels clear out in the first third of a choice. */
export function labelOpacity(chosen: Direction | null, progress: number): number {
  return chosen === null ? 1 : Math.max(0, 1 - progress * 3);
}

/** The curve from the main line to a stop's turn, matching the stop's own drawn branch. */
export function stopCurvePath(side: -1 | 1, reach: number, radius: number): string {
  const out = side > 0 ? 0 : 1;
  const bend = side > 0 ? 1 : 0;
  const level = radius - 1;
  return `M 0 0 A ${radius} ${radius} 0 0 ${out} ${side * radius} ${level} L ${side * reach} ${level} A ${radius} ${radius} 0 0 ${bend} ${side * (reach + radius - 1)} ${level + radius}`;
}
