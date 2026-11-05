import { nodeAt } from "../tree/walk";
import { chooseEase } from "./controller";
import { branchPath, STUB_RATIO } from "./geometry";
import { holdScroll } from "./scrollHold";

const COVER_MS = 180;
const MOVE_MS = 900;
const UNCOVER_MS = 180;
const CURVE_STEM_PX = 64;

type RouterEvent = Event & { from: URL; to: URL; loader: () => Promise<void> };

interface Pieces {
  layer: HTMLElement;
  world: HTMLElement;
  rest: HTMLElement;
  ahead: HTMLElement;
  curve: SVGPathElement;
}

/** Copies the current line and the chosen stop's branch into a layer that can move as one. */
function place(pieces: Pieces, branch: Element, lineX: number): { x: number; y: number } {
  const box = branch.getBoundingClientRect();
  const fromX = lineX;
  // A subsection's branch bends on past its box by the box's own height.
  const toX = box.left < fromX - 1 ? box.left - box.height : box.right + box.height;
  const spread = Math.abs(toX - fromX);
  const stub = CURVE_STEM_PX * STUB_RATIO;
  pieces.curve.setAttribute("d", branchPath(spread, CURVE_STEM_PX, toX < fromX ? -1 : 1));
  const style = pieces.layer.style;
  style.setProperty("--continue-from", `${fromX}px`);
  style.setProperty("--continue-to", `${toX}px`);
  style.setProperty("--continue-y", `${box.top}px`);
  style.setProperty("--continue-spread", `${spread}px`);
  style.setProperty("--continue-stub", `${stub}px`);
  return { x: fromX - toX, y: -(box.top + stub) };
}

/**
 * Carries the line into a subsection: the chosen stop's branch slides to the center and
 * becomes the main line. The route swaps behind the covering layer. Returns a cleanup.
 */
export function mountContinuation(stage: HTMLElement): () => void {
  const layer = stage.querySelector<HTMLElement>("[data-continue]")!;
  const pieces: Pieces = {
    layer,
    world: layer.querySelector<HTMLElement>(".line-continue-world")!,
    rest: layer.querySelector<HTMLElement>(".line-continue-rest")!,
    ahead: layer.querySelector<HTMLElement>(".line-continue-ahead")!,
    curve: layer.querySelector<SVGPathElement>("path")!,
  };
  const ease = chooseEase();
  let running: Animation[] = [];
  let offset: { x: number; y: number } | null = null;

  const stop = () => {
    for (const animation of running) animation.cancel();
    running = [];
    offset = null;
    layer.style.visibility = "hidden";
    holdScroll("continuation", false);
  };

  const onPrepare = (event: Event) => {
    stop();
    const { from, to, loader } = event as RouterEvent;
    const here = nodeAt(from.pathname);
    const next = nodeAt(to.pathname);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !here?.parent || !next || next.parent !== here || next.children.length === 0) return;
    const branch = document.querySelector(`[data-stop-url="${next.url}"] .stop-branch`);
    if (!branch) return;

    const tail = stage.querySelector(".line-tail")!.getBoundingClientRect();
    offset = place(pieces, branch, tail.left + tail.width / 2);
    layer.style.visibility = "visible";
    holdScroll("continuation", true);
    const cover = layer.animate({ opacity: [0, 1] }, { duration: COVER_MS, easing: ease });
    running = [cover];
    (event as RouterEvent).loader = async () => {
      await cover.finished.catch(() => undefined);
      await loader();
    };
  };

  const onSwapped = async () => {
    if (!offset) return;
    const timing = { duration: MOVE_MS, easing: ease, fill: "forwards" as const };
    const camera = pieces.world.animate({ transform: ["translate(0, 0)", `translate(${offset.x}px, ${offset.y}px)`] }, timing);
    running = [
      camera,
      pieces.rest.animate({ transform: ["scaleY(1)", "scaleY(0)"] }, timing),
      pieces.ahead.animate({ transform: ["scaleY(0)", "scaleY(1)"] }, timing),
    ];
    try {
      await camera.finished;
      const uncover = layer.animate({ opacity: [1, 0] }, { duration: UNCOVER_MS, easing: ease });
      running.push(uncover);
      await uncover.finished;
      stop();
    } catch {
      // A newer navigation cancelled this move, and it has already cleaned up.
    }
  };

  document.addEventListener("astro:before-preparation", onPrepare);
  document.addEventListener("astro:after-swap", onSwapped);
  return () => {
    stop();
    document.removeEventListener("astro:before-preparation", onPrepare);
    document.removeEventListener("astro:after-swap", onSwapped);
  };
}
