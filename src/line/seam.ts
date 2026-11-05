import { isLeafPath } from "../tree/walk";
import { chooseEase } from "./controller";

const COVER_FADE_MS = 180;
const CLOSE_MS = 500;
const OPEN_MS = 800;
const UNCOVER_FADE_MS = 180;

type Pose = { transform: string; opacity: string };
type RouterEvent = Event & { from: URL; to: URL; loader: () => Promise<void> };

const CLEAR: Pose = { transform: "translateX(0)", opacity: "0" };
const SHUT: Pose = { transform: "translateX(0)", opacity: "1" };

/** Each side of the seam parts toward its own edge of the screen. */
const parted = (index: number): Pose => ({ transform: `translateX(${index === 0 ? -100 : 100}%)`, opacity: "1" });

/**
 * Opens the line like a seam whenever a route enters or leaves a leaf. The swap waits
 * until the seam is shut, so a leaf owns the whole screen with no line to plan around.
 * Returns a cleanup.
 */
export function mountSeam(stage: HTMLElement): () => void {
  const panels = [...stage.querySelectorAll<HTMLElement>("[data-seam]")];
  const ease = chooseEase();
  let active = false;
  let running: Animation[] = [];
  let toLeaf = false;

  const move = async (pose: (index: number) => Pose, duration: number): Promise<boolean> => {
    const from = panels.map((panel) => {
      const { transform, opacity } = getComputedStyle(panel);
      return { transform, opacity };
    });
    for (const animation of running) animation.cancel();
    const current = panels.map((panel, index) => {
      const to = pose(index);
      panel.style.transform = to.transform;
      panel.style.opacity = to.opacity;
      return panel.animate([from[index], to], { duration, easing: ease });
    });
    running = current;
    try {
      await Promise.all(current.map((animation) => animation.finished));
      return true;
    } catch {
      return false;
    }
  };

  const place = (pose: (index: number) => Pose) => {
    panels.forEach((panel, index) => {
      Object.assign(panel.style, pose(index));
      panel.style.visibility = "visible";
    });
  };

  const onPrepare = (event: Event) => {
    const { from, to, loader } = event as RouterEvent;
    const fromLeaf = isLeafPath(from.pathname);
    toLeaf = isLeafPath(to.pathname);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !(active || fromLeaf || toLeaf)) return;

    if (!active) place(fromLeaf ? parted : () => CLEAR);
    active = true;
    const shut = move(() => SHUT, fromLeaf ? CLOSE_MS : COVER_FADE_MS);
    (event as RouterEvent).loader = async () => {
      await shut;
      await loader();
    };
  };

  const onSwapped = async () => {
    if (!active) return;
    const finished = await (toLeaf ? move(parted, OPEN_MS) : move(() => CLEAR, UNCOVER_FADE_MS));
    if (!finished) return;
    active = false;
    for (const panel of panels) panel.style.visibility = "hidden";
  };

  document.addEventListener("astro:before-preparation", onPrepare);
  document.addEventListener("astro:after-swap", onSwapped);
  return () => {
    for (const animation of running) animation.cancel();
    document.removeEventListener("astro:before-preparation", onPrepare);
    document.removeEventListener("astro:after-swap", onSwapped);
  };
}
