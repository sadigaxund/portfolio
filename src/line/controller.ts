import { isLeafPath, nodeAt, ROOT } from "../tree/walk";
import { clearContent, revealContent } from "./content";
import { chooseEase } from "./ease";
import { createRunner } from "./runner";
import { createScene } from "./scene";
import { holdScroll } from "./scrollHold";
import { CLEAR_MS, createSteps } from "./steps";
import { linePathOf, planWalk, type Step } from "./walkPlan";

/** A walk across several levels moves faster, so a history jump stays short. */
const LONG_WALK_SPEED = 0.6;

type RouterEvent = Event & { from: URL; to: URL; loader: () => Promise<void> };

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function announce(stage: HTMLElement, name: string, detail: object): void {
  stage.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
}

/**
 * Walks the one line through its one world. Each step clears what leaves, pans the camera,
 * then draws what arrives, and going back is the same steps reversed. Returns a cleanup.
 */
export function mountLine(stage: HTMLElement, probe: HTMLElement, initialPath: string): () => void {
  const runner = createRunner();
  const scene = createScene(stage, probe, linePathOf(nodeAt(initialPath)));
  const { clearStep, panStep, growStep } = createSteps(stage, scene, runner, chooseEase());
  let backHref = "";
  let pending: { steps: Step[]; speed: number; returned?: string } | null = null;
  let jumpAtSwap: string | null = null;
  let scrollBefore = 0;
  let walkId = 0;

  const settle = (id: number) => {
    if (id !== walkId) return;
    stage.dataset.settled = "true";
    holdScroll("line", false);
    announce(stage, "line:transition-end", { reduced: false });
  };

  const finishWalk = async (id: number, steps: Step[], speed: number, returned?: string) => {
    try {
      for (const [index, step] of steps.entries()) {
        if (index > 0) await clearStep(step, speed);
        await panStep(step, speed, index === 0 ? scrollY - scrollBefore : 0);
        if (id !== walkId) return;
        if (index < steps.length - 1) await growStep(step, speed);
      }
      const last = steps[steps.length - 1];
      await Promise.all([growStep(last, speed), revealContent(runner, returned)]);
      settle(id);
    } catch {
      // A newer walk cancelled this one, and it owns the scene now.
    }
  };

  const jumpTo = (path: string) => {
    for (const node of [...scene.walked].slice(1)) scene.dropLevel(node);
    scene.walked = [];
    for (const node of linePathOf(nodeAt(path))) {
      if (scene.walked.length === 0) scene.walked.push(node);
      else scene.addLevel(node);
    }
    scene.focus = scene.walked.length;
    scene.render();
  };

  const onPrepare = (event: Event) => {
    const { from, to, loader } = event as RouterEvent;
    const node = nodeAt(to.pathname);
    backHref = (node?.parent ?? ROOT).url;
    walkId += 1;
    runner.cancel();
    pending = null;
    if (stage.dataset.settled === "false") {
      // Interrupted: land on where the visitor is now, then start fresh from there.
      jumpTo(from.pathname);
      delete document.documentElement.dataset.lineReveal;
      stage.dataset.settled = "true";
      holdScroll("line", false);
    }
    if (reducedMotion()) {
      jumpTo(to.pathname);
      return;
    }
    if (isLeafPath(from.pathname) || isLeafPath(to.pathname)) {
      jumpAtSwap = to.pathname;
      return;
    }
    const steps = planWalk(linePathOf(nodeAt(from.pathname)), linePathOf(node));
    if (steps.length === 0) return;

    const speed = steps.length > 1 ? LONG_WALK_SPEED : 1;
    const first = steps[0];
    const returned = [...steps].reverse().find((step) => step.kind === "up" && step.node.parent === node)?.node.url;
    stage.dataset.settled = "false";
    holdScroll("line", true);
    const lineCleared = clearStep(first, speed);
    const keep = first.kind === "down" ? first.node.url : undefined;
    const contentCleared = clearContent(runner, CLEAR_MS * speed, keep);
    pending = { steps, speed, returned };
    (event as RouterEvent).loader = async () => {
      await Promise.all([lineCleared, contentCleared]).catch(() => undefined);
      await loader();
    };
  };

  const onBeforeSwap = (event: Event) => {
    scene.back.querySelector("a")?.setAttribute("href", backHref);
    scrollBefore = scrollY;
    const incoming = (event as Event & { newDocument?: Document }).newDocument;
    if (pending && incoming) incoming.documentElement.dataset.lineReveal = "pending";
  };

  const onSwapped = () => {
    if (jumpAtSwap) {
      jumpTo(jumpAtSwap);
      jumpAtSwap = null;
    }
    if (!pending) return;
    const { steps, speed, returned } = pending;
    pending = null;
    scene.aim();
    void finishWalk(walkId, steps, speed, returned);
  };

  const onResize = () => {
    if (stage.dataset.settled === "true") scene.render();
  };

  scene.render();
  stage.dataset.settled = "true";
  stage.dataset.ready = "true";
  const resize = new ResizeObserver(onResize);
  resize.observe(stage);
  document.addEventListener("astro:before-preparation", onPrepare);
  document.addEventListener("astro:before-swap", onBeforeSwap);
  document.addEventListener("astro:after-swap", onSwapped);
  return () => {
    walkId += 1;
    runner.cancel();
    holdScroll("line", false);
    resize.disconnect();
    document.removeEventListener("astro:before-preparation", onPrepare);
    document.removeEventListener("astro:before-swap", onBeforeSwap);
    document.removeEventListener("astro:after-swap", onSwapped);
  };
}
