import type { Direction } from "../tree/tree";
import { nodeAt, ROOT } from "../tree/walk";
import { branchPath, DIRECTIONS, labelOpacity, retraction, type Measure } from "./geometry";

const EASES = {
  sine: "cubic-bezier(0.37, 0, 0.63, 1)",
  cubic: "cubic-bezier(0.65, 0, 0.35, 1)",
  fast: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

const FORWARD_MS = 900;
const REVERSE_MS = 500;
const LABEL_SHARE = 0.35;

/** Reads ?ease= once at mount, so curves can be compared side by side. */
function chooseEase(): string {
  const name = new URLSearchParams(location.search).get("ease");
  return name === "cubic" || name === "fast" ? EASES[name] : EASES.sine;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function required<T extends Element>(root: Element, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`Line stage is missing ${selector}`);
  return found;
}

interface Parts {
  world: HTMLElement;
  tail: HTMLElement;
  back: HTMLElement;
  branches: { direction: Direction; path: SVGPathElement; label: HTMLElement | null }[];
}

interface Move {
  chosen: Direction | null;
  from: number;
  to: number;
  duration: number;
  ease: string;
  worldFrom: string;
  tailFrom: string;
}

/** Starts one move. The camera comes first in the result, because it times the others. */
function animateParts(parts: Parts, move: Move): Animation[] {
  const { chosen, from, to, duration } = move;
  const timing = { duration, easing: move.ease };
  const fade = {
    duration: duration * LABEL_SHARE,
    delay: to === 0 ? duration * (1 - LABEL_SHARE) : 0,
    fill: "backwards" as const,
  };
  const running = [
    parts.world.animate({ transform: [move.worldFrom, getComputedStyle(parts.world).transform] }, timing),
    parts.tail.animate({ transform: [move.tailFrom, getComputedStyle(parts.tail).transform] }, timing),
    parts.back.animate({ opacity: [from, to] }, timing),
  ];
  for (const { direction, path, label } of parts.branches) {
    const retract = [retraction(chosen, direction, from), retraction(chosen, direction, to)];
    running.push(path.animate({ strokeDashoffset: retract.map(String) }, timing));
    if (label) running.push(label.animate({ opacity: [labelOpacity(chosen, from), labelOpacity(chosen, to)] }, fade));
  }
  return running;
}

function measureStage(stage: HTMLElement, probe: HTMLElement): Measure {
  const box = probe.getBoundingClientRect();
  const stem = probe.firstElementChild?.getBoundingClientRect().height ?? 0;
  const lift = probe.lastElementChild?.getBoundingClientRect().height ?? 0;
  return { centerX: stage.clientWidth / 2, forkY: box.height, spread: box.width, stem, height: stage.clientHeight, lift };
}

/**
 * Declares each move once and lets the browser run it, so the camera and the long
 * line animate on the compositor. Nothing here runs per frame. Returns a cleanup.
 */
export function mountLine(
  stage: HTMLElement,
  probe: HTMLElement,
  initialChosen: Direction | null,
): () => void {
  const ease = chooseEase();
  const world = required<HTMLElement>(stage, ".line-world");
  const tail = required<HTMLElement>(stage, ".line-tail");
  const back = required<HTMLElement>(stage, "[data-back]");
  const branches = DIRECTIONS.map((direction) => ({
    direction,
    path: required<SVGPathElement>(stage, `[data-branch="${direction}"]`),
    label: stage.querySelector<HTMLElement>(`[data-option="${direction}"]`),
  }));
  const parts: Parts = { world, tail, back, branches };

  let chosen = initialChosen;
  let target = initialChosen;
  let settled = initialChosen === null ? 0 : 1;
  let running: Animation[] = [];
  let currentProgress: () => number = () => settled;
  let moved = false;

  const measure = () => measureStage(stage, probe);

  const drawPaths = () => {
    const { spread, stem } = measure();
    for (const { direction, path } of branches) path.setAttribute("d", branchPath(spread, stem, direction));
  };

  const applyState = (progress: number) => {
    stage.style.setProperty("--line-p", String(progress));
    stage.style.setProperty("--line-dir", String(chosen ?? 0));
    stage.dataset.chosen = chosen === null ? "none" : String(chosen);
    for (const { direction, path, label } of branches) {
      path.style.strokeDashoffset = String(retraction(chosen, direction, progress));
      if (label) label.style.opacity = String(labelOpacity(chosen, progress));
    }
    back.style.opacity = String(progress);
  };

  // A hidden link leaves the tab order, so keyboard users only reach what they can see.
  const applyVisibility = (progress: number, moving: boolean) => {
    for (const { label } of branches) {
      if (label) label.style.visibility = moving || labelOpacity(chosen, progress) > 0 ? "visible" : "hidden";
    }
    back.style.visibility = moving || progress > 0 ? "visible" : "hidden";
  };

  const announce = (name: string, detail: object) =>
    stage.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));

  const stopRunning = () => {
    for (const animation of running) animation.cancel();
    running = [];
  };

  const run = (to: number, duration: number, done: () => void) => {
    const from = currentProgress();
    const worldFrom = getComputedStyle(world).transform;
    const tailFrom = getComputedStyle(tail).transform;
    stopRunning();
    applyState(to);
    stage.dataset.settled = "false";
    applyVisibility(to, true);

    const finish = () => {
      settled = to;
      currentProgress = () => settled;
      applyVisibility(to, false);
      stage.dataset.settled = "true";
      announce("line:transition-end", { reduced: running.length === 0 });
      done();
    };

    if (prefersReducedMotion()) {
      settled = to;
      currentProgress = () => settled;
      announce("line:transition-start", { from, to, seconds: 0, chosen, measure: measure(), progress: () => to });
      finish();
      return;
    }

    running = animateParts(parts, { chosen, from, to, duration, ease, worldFrom, tailFrom });
    const camera = running[0];
    currentProgress = () => from + (to - from) * (camera.effect?.getComputedTiming().progress ?? 1);
    announce("line:transition-start", { from, to, seconds: duration / 1000, chosen, measure: measure(), progress: currentProgress });
    camera.finished.then(finish).catch(() => undefined);
  };

  const open = () => {
    if (target === null) {
      chosen = null;
      settled = 0;
      currentProgress = () => settled;
      applyState(0);
      applyVisibility(0, false);
      return;
    }
    chosen = target;
    run(1, FORWARD_MS, () => undefined);
  };

  const goTo = (path: string) => {
    const node = nodeAt(path);
    target = node?.direction ?? null;
    back.querySelector("a")?.setAttribute("href", (node?.parent ?? ROOT).url);
    const goal = target === null ? 0 : 1;
    // Moving between pages on one branch leaves the line where it is.
    moved = currentProgress() !== goal || (goal === 1 && chosen !== target);
    if (!moved) return;
    if (chosen === target) {
      run(target === null ? 0 : 1, FORWARD_MS, () => undefined);
    } else if (chosen === null || currentProgress() === 0) {
      open();
    } else {
      // Leave the current branch first, so a change of path always passes the fork.
      run(0, REVERSE_MS, open);
    }
  };

  const onNavigate = (event: Event) => {
    const to = (event as Event & { to?: URL }).to;
    if (to) goTo(to.pathname);
  };

  // Tells the incoming page whether to hold its content back for the moving line.
  const onSwap = (event: Event) => {
    const incoming = (event as Event & { newDocument?: Document }).newDocument;
    if (moved && incoming) incoming.documentElement.dataset.lineMoved = "true";
  };

  drawPaths();
  applyState(settled);
  applyVisibility(settled, false);
  stage.dataset.settled = "true";
  stage.dataset.ready = "true";
  const resize = new ResizeObserver(drawPaths);
  resize.observe(stage);
  document.addEventListener("astro:before-preparation", onNavigate);
  document.addEventListener("astro:before-swap", onSwap);
  return () => {
    stopRunning();
    resize.disconnect();
    document.removeEventListener("astro:before-preparation", onNavigate);
    document.removeEventListener("astro:before-swap", onSwap);
  };
}
