import type { TreeNode } from "../tree/walk";
import { DIRECTIONS, labelOpacity, retraction, stopCurvePath, branchPath, STUB_RATIO, type Measure } from "./geometry";
import type { Direction } from "../tree/tree";

/** One level of the walked line, in world coordinates. */
export interface Level {
  node: TreeNode;
  run: HTMLElement;
  curve: SVGPathElement;
  x: number;
  top: number;
  /** Length of the run down to where the next level leaves it. */
  cut: number | null;
}

export interface Scene {
  /** The nodes the line has been drawn through, root excluded. */
  walked: TreeNode[];
  /** How many walked nodes the camera has reached. */
  focus: number;
  tail: HTMLElement;
  branches: { direction: Direction; path: SVGPathElement; label: HTMLElement | null }[];
  back: HTMLElement;
  measure(): Measure;
  levels(): Level[];
  addLevel(node: TreeNode): void;
  dropLevel(node: TreeNode): void;
  aim(): void;
  render(): void;
}

function required<T extends Element>(root: Element, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`Line stage is missing ${selector}`);
  return found;
}

function measureStage(stage: HTMLElement, probe: HTMLElement): Measure {
  const box = probe.getBoundingClientRect();
  const size = (name: string) => required(probe, name).getBoundingClientRect().height;
  const stem = size(".line-probe-stem");
  const lift = size(".line-probe-lift");
  const firstStop = size(".line-probe-first") - (box.height + stem * STUB_RATIO - lift);
  return {
    centerX: stage.clientWidth / 2,
    forkY: box.height,
    spread: box.width,
    stem,
    height: stage.clientHeight,
    lift,
    reach: size(".line-probe-reach"),
    drop: size(".line-probe-drop"),
    firstStop,
    stopGap: size(".line-probe-gap"),
    bothSides: !window.matchMedia("(max-width: 40rem)").matches,
  };
}

/** Holds the one world every line lives in, and the camera that looks at it. */
export function createScene(stage: HTMLElement, probe: HTMLElement, path: TreeNode[]): Scene {
  const extras = required<HTMLElement>(stage, ".line-levels");
  const tail = required<HTMLElement>(stage, ".line-tail");
  const back = required<HTMLElement>(stage, "[data-back]");
  const branches = DIRECTIONS.map((direction) => ({
    direction,
    path: required<SVGPathElement>(stage, `[data-branch="${direction}"]`),
    label: stage.querySelector<HTMLElement>(`[data-option="${direction}"]`),
  }));
  const parts = new Map<TreeNode, { run: HTMLElement; curve: SVGPathElement; holder: SVGSVGElement }>();

  const scene: Scene = {
    walked: [],
    focus: 0,
    tail,
    branches,
    back,
    measure: () => measureStage(stage, probe),

    levels() {
      const m = scene.measure();
      const out: Level[] = [];
      scene.walked.forEach((node, index) => {
        if (index === 0) {
          const curve = branches.find((branch) => branch.direction === node.direction)!.path;
          out.push({ node, run: tail, curve, x: m.centerX + (node.direction ?? 0) * m.spread, top: m.forkY + m.stem * STUB_RATIO, cut: null });
          return;
        }
        const parent = out[index - 1];
        const order = node.parent!.children.indexOf(node);
        const side = m.bothSides && order % 2 === 1 ? -1 : 1;
        const startY = parent.top + m.firstStop + order * m.stopGap;
        parent.cut = startY - parent.top;
        const own = parts.get(node)!;
        out.push({
          node,
          run: own.run,
          curve: own.curve,
          x: parent.x + side * (m.reach + m.drop - 1),
          top: startY + m.drop * 2 - 1,
          cut: null,
        });
        own.holder.style.left = `${parent.x}px`;
        own.holder.style.top = `${startY}px`;
        own.curve.setAttribute("d", stopCurvePath(side, m.reach, m.drop));
      });
      return out;
    },

    addLevel(node) {
      const holder = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      holder.setAttribute("class", "line-level-curve");
      const curve = document.createElementNS("http://www.w3.org/2000/svg", "path");
      curve.setAttribute("class", "line-path");
      curve.setAttribute("pathLength", "1");
      holder.append(curve);
      const run = document.createElement("div");
      run.className = "line-run";
      run.style.transform = "scaleY(0)";
      extras.append(holder, run);
      parts.set(node, { run, curve, holder });
      scene.walked.push(node);
    },

    dropLevel(node) {
      const own = parts.get(node);
      own?.run.remove();
      own?.holder.remove();
      parts.delete(node);
      scene.walked = scene.walked.filter((walked) => walked !== node);
    },

    /** Points the camera at the focused level, without animating. */
    aim() {
      const m = scene.measure();
      const levels = scene.levels();
      const first = levels[0];
      const focused = levels[scene.focus - 1];
      const camX = focused && first ? first.x - focused.x : 0;
      const camY = focused && first ? first.top - focused.top : 0;
      stage.style.setProperty("--line-p", String(scene.focus > 0 ? 1 : 0));
      stage.style.setProperty("--line-dir", String(first?.node.direction ?? 0));
      stage.style.setProperty("--line-cam-x", `${camX}px`);
      stage.style.setProperty("--line-cam-y", `${camY}px`);
      stage.dataset.chosen = first ? String(first.node.direction) : "none";
      for (const level of levels) {
        const length = m.height - (m.forkY + m.stem * STUB_RATIO - m.lift);
        level.run.style.height = `${Math.max(length, 0)}px`;
        if (level.run !== tail) {
          level.run.style.left = `${level.x - 1}px`;
          level.run.style.top = `${level.top}px`;
        }
      }
    },

    /** Draws the settled state for the current walked path and focus. */
    render() {
      const m = scene.measure();
      for (const { direction, path: branch } of branches) branch.setAttribute("d", branchPath(m.spread, m.stem, direction));
      scene.aim();
      const chosen = scene.walked[0]?.direction ?? null;
      const progress = scene.focus > 0 ? 1 : 0;
      for (const { direction, path: branch, label } of branches) {
        branch.style.strokeDashoffset = String(retraction(chosen, direction, progress));
        if (label) {
          label.style.opacity = String(labelOpacity(chosen, progress));
          label.style.visibility = chosen === null ? "visible" : "hidden";
        }
      }
      tail.style.transform = "scaleY(0)";
      scene.levels().forEach((level) => {
        const length = parseFloat(level.run.style.height) || 1;
        level.run.style.transform = `scaleY(${level.cut === null ? 1 : level.cut / length})`;
      });
      back.style.opacity = String(progress);
      back.style.visibility = progress > 0 ? "visible" : "hidden";
    },
  };

  for (const node of path) {
    if (scene.walked.length === 0) scene.walked.push(node);
    else scene.addLevel(node);
  }
  scene.focus = path.length;
  return scene;
}
