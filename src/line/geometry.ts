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

export interface LineState {
  /** The chosen branch, or null while the fork is open. */
  chosen: Direction | null;
  /** Progress of the choice, from 0 (open fork) to 1 (branch is the main line). */
  progress: number;
}

export interface BranchFrame {
  direction: Direction;
  path: string;
  /** Fraction of the path that is drawn, from 0 to 1. */
  drawn: number;
}

export interface LineFrame {
  trunk: string;
  branches: BranchFrame[];
}

function branchPath(m: Measure, direction: Direction, end: number): string {
  const exitX = m.centerX + direction * m.spread;
  const curveEnd = m.forkY + m.stem;
  const control = m.forkY + m.stem / 2;
  const curve = `C ${m.centerX} ${control} ${exitX} ${control} ${exitX} ${curveEnd}`;
  return `M ${m.centerX} ${m.forkY} ${curve} L ${exitX} ${end}`;
}

/** Computes one frame of the line. A pure function of the measure and the state. */
export function lineFrame(m: Measure, state: LineState): LineFrame {
  const stubEnd = m.forkY + m.stem + m.stem / 2;
  // The chosen branch must reach the page bottom after the world lifts.
  const fullEnd = m.height + m.lift;
  const branches = DIRECTIONS.map((direction) => {
    const isChosen = state.chosen === direction;
    const end = isChosen ? stubEnd + (fullEnd - stubEnd) * state.progress : stubEnd;
    const drawn = state.chosen === null || isChosen ? 1 : 1 - state.progress;
    return { direction, path: branchPath(m, direction, end), drawn };
  });
  return { trunk: `M ${m.centerX} 0 L ${m.centerX} ${m.forkY}`, branches };
}
