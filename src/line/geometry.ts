/** Direction of a branch at a fork: left, straight on, or right. */
export type Direction = -1 | 0 | 1;

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
