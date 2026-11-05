import { animate } from "motion";
import { lineFrame, type Direction, type LineState, type Measure } from "./geometry";

export interface ForkOption {
  direction: Direction;
  label: string;
  href: string;
}

const EASES = {
  sine: [0.37, 0, 0.63, 1],
  cubic: [0.65, 0, 0.35, 1],
  fast: [0.16, 1, 0.3, 1],
} as const;

/** Reads ?ease= once at mount, so curves can be compared side by side. */
function chooseEase(): readonly [number, number, number, number] {
  const name = new URLSearchParams(location.search).get("ease");
  return name === "cubic" || name === "fast" ? EASES[name] : EASES.sine;
}
const FORWARD_SECONDS = 0.9;
const REVERSE_SECONDS = 0.5;

function normalize(path: string): string {
  return path.length > 1 ? path.replace(/\/$/, "") : path;
}

export function chosenFor(options: ForkOption[], path: string): Direction | null {
  const match = options.find((option) => normalize(option.href) === normalize(path));
  return match ? match.direction : null;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Drives the line by writing to the DOM directly, so frames skip React. Returns a cleanup. */
export function mountLine(
  stage: HTMLElement,
  probe: HTMLElement,
  options: ForkOption[],
  initialChosen: Direction | null,
): () => void {
  const ease = chooseEase();
  const state: LineState = { chosen: initialChosen, progress: initialChosen === null ? 0 : 1 };
  let target: Direction | null = initialChosen;
  let measure: Measure;
  let stop: (() => void) | null = null;

  const read = () => {
    const styles = probe.getBoundingClientRect();
    const stem = probe.firstElementChild?.getBoundingClientRect().height ?? 0;
    const lift = probe.lastElementChild?.getBoundingClientRect().height ?? 0;
    measure = {
      centerX: stage.clientWidth / 2,
      forkY: styles.height,
      spread: styles.width,
      stem,
      height: stage.clientHeight,
      lift,
    };
  };

  const render = () => {
    const frame = lineFrame(measure, state);
    stage.querySelector("[data-trunk]")?.setAttribute("d", frame.trunk);
    stage.style.setProperty("--line-p", String(state.progress));
    stage.style.setProperty("--line-dir", String(state.chosen ?? 0));
    stage.dataset.chosen = state.chosen === null ? "none" : String(state.chosen);
    for (const branch of frame.branches) {
      const path = stage.querySelector(`[data-branch="${branch.direction}"]`);
      path?.setAttribute("d", branch.path);
      path?.setAttribute("stroke-dasharray", `${branch.drawn} 1`);
      const option = stage.querySelector<HTMLElement>(`[data-option="${branch.direction}"]`);
      if (!option) continue;
      // Labels clear out early, and a hidden label leaves the tab order.
      const fade = state.chosen === null ? 1 : Math.max(0, 1 - state.progress * 3);
      option.style.opacity = String(fade);
      option.style.visibility = fade > 0 ? "visible" : "hidden";
    }
    const back = stage.querySelector<HTMLElement>("[data-back]");
    if (back) {
      back.style.opacity = String(state.progress);
      back.style.visibility = state.progress > 0 ? "visible" : "hidden";
    }
  };

  // Reports each run to listeners such as the debug meter. Changes no motion.
  const announce = (name: string, detail: object) =>
    stage.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));

  const run = (to: number, seconds: number, done: () => void) => {
    stop?.();
    announce("line:transition-start", { from: state.progress, to, seconds, chosen: state.chosen, measure });
    if (prefersReducedMotion()) {
      state.progress = to;
      render();
      announce("line:transition-end", { reduced: true });
      done();
      return;
    }
    const controls = animate(state.progress, to, {
      duration: seconds,
      ease: [...ease],
      onUpdate: (value) => {
        state.progress = value;
        render();
      },
      onComplete: () => {
        announce("line:transition-end", { reduced: false });
        done();
      },
    });
    stop = () => controls.stop();
  };

  const open = () => {
    if (target === null) {
      state.chosen = null;
      state.progress = 0;
      render();
      return;
    }
    state.chosen = target;
    render();
    run(1, FORWARD_SECONDS, () => undefined);
  };

  const goTo = (path: string) => {
    target = chosenFor(options, path);
    if (state.chosen === target) {
      run(target === null ? 0 : 1, FORWARD_SECONDS, () => undefined);
    } else if (state.chosen === null || state.progress === 0) {
      open();
    } else {
      // Leave the current branch first, so a change of path always passes the fork.
      run(0, REVERSE_SECONDS, open);
    }
  };

  const onNavigate = (event: Event) => {
    const to = (event as Event & { to?: URL }).to;
    if (to) goTo(to.pathname);
  };

  read();
  render();
  stage.dataset.ready = "true";
  const resize = new ResizeObserver(() => {
    read();
    render();
  });
  resize.observe(stage);
  document.addEventListener("astro:before-preparation", onNavigate);
  return () => {
    stop?.();
    resize.disconnect();
    document.removeEventListener("astro:before-preparation", onNavigate);
  };
}
