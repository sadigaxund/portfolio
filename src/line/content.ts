import type { Runner } from "./runner";

const STOP_HOLD_MS = 200;
const STOP_STEP_MS = 110;
const STOP_DRAW_MS = 240;
const LABEL_MS = 200;
const FADE_MS = 240;

/** The clip runs past the box, because a stop's ending extends beyond it. */
const OPEN_FULLY = { end: "inset(-2rem -3rem -3rem 0)", start: "inset(-2rem 0 -3rem -3rem)" };
const CLOSED = { end: "inset(-2rem 100% -3rem 0)", start: "inset(-2rem 0 -3rem 100%)" };

function sideOf(stop: Element): "end" | "start" {
  return getComputedStyle(stop).flexDirection === "row-reverse" ? "start" : "end";
}

const blocks = () => [...document.querySelectorAll<HTMLElement>("main .hero, main .line-content")];
const stops = () => [...document.querySelectorAll<HTMLElement>("main .stop")];

/**
 * Takes the page's content off the line. The kept stop's branch vanishes at once,
 * because the line itself has already drawn the same curve over it.
 */
export function clearContent(runner: Runner, duration: number, keepUrl?: string): Promise<unknown> {
  const timing = { duration, easing: "ease-in", fill: "forwards" as const };
  const parts: Promise<unknown>[] = blocks().map((block) => runner.play(block, { opacity: [1, 0] }, timing));
  for (const stop of stops()) {
    const branch = stop.querySelector(".stop-branch")!;
    const label = stop.querySelector("a");
    if (label) parts.push(runner.play(label, { opacity: [1, 0] }, timing));
    if (stop.dataset.stopUrl === keepUrl) {
      branch.setAttribute("style", "visibility: hidden");
      continue;
    }
    const side = sideOf(stop);
    parts.push(runner.play(branch, { clipPath: [OPEN_FULLY[side], CLOSED[side]] }, timing));
  }
  return Promise.all(parts);
}

/**
 * Brings the page's content onto the line: text first, then each stop in order as the
 * tip of the line passes it. The returned stop's branch appears at once, where the line drew it.
 */
export function revealContent(runner: Runner, returnedUrl?: string): Promise<unknown> {
  delete document.documentElement.dataset.lineReveal;
  const parts: Promise<unknown>[] = blocks().map((block) =>
    runner.play(block, { opacity: [0, 1] }, { duration: FADE_MS, easing: "ease-out", fill: "backwards" }),
  );
  stops().forEach((stop, index) => {
    const delay = STOP_HOLD_MS + Math.min(index, 8) * STOP_STEP_MS;
    const branch = stop.querySelector(".stop-branch")!;
    const label = stop.querySelector("a");
    if (stop.dataset.stopUrl !== returnedUrl) {
      const side = sideOf(stop);
      parts.push(
        runner.play(branch, { clipPath: [CLOSED[side], OPEN_FULLY[side]] }, { duration: STOP_DRAW_MS, delay, easing: "ease-out", fill: "backwards" }),
      );
    }
    if (label) {
      const timing = { duration: LABEL_MS, delay: delay + 120, easing: "ease-out", fill: "backwards" as const };
      parts.push(runner.play(label, { opacity: [0, 1] }, timing));
    }
  });
  return Promise.all(parts);
}
