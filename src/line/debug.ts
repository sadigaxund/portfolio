import css from "../styles/debug.css?inline";
import type { Measure } from "./geometry";
import { browserName, refreshFromTimes, summarize, type Geometry } from "./debugStats";

interface StartDetail {
  from: number;
  to: number;
  seconds: number;
  chosen: -1 | 0 | 1 | null;
  measure: Measure;
}

interface Run {
  stage: HTMLElement;
  detail: StartDetail;
  begun: number;
  ended: number;
  times: number[];
  progress: number[];
  interrupted: boolean;
  active: boolean;
}

interface ViewTransitionLog {
  begun: number;
  finished: number;
}

const SETTLE_MS = 300;
const IDLE_FRAMES = 90;
const UNSUPPORTED = "unsupported";

let refreshHz = 0;
let run: Run | null = null;
let last: Record<string, unknown> | null = null;
const loaf: PerformanceEntry[] = [];
const transitions: ViewTransitionLog[] = [];
const swaps: { before: number; after: number }[] = [];
let observer: PerformanceObserver | null = null;
let overlay: HTMLElement | null = null;
let readout: HTMLElement | null = null;

const round = (value: number, digits = 1) => Number(value.toFixed(digits));

function measureRefresh(): Promise<number> {
  return new Promise((resolve) => {
    const times: number[] = [];
    const tick = (time: number) => {
      times.push(time);
      if (run || times.length >= IDLE_FRAMES) return resolve(refreshFromTimes(times.slice(5)));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function renderer(): string {
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    return info ? String(gl?.getParameter(info.UNMASKED_RENDERER_WEBGL)) : UNSUPPORTED;
  } catch {
    return UNSUPPORTED;
  }
}

function watchViewTransitions() {
  const original = document.startViewTransition?.bind(document);
  if (!original) return;
  document.startViewTransition = (...args: Parameters<typeof original>) => {
    const transition = original(...args);
    const log = { begun: performance.now(), finished: 0 };
    transitions.push(log);
    void transition.finished.finally(() => (log.finished = performance.now()));
    return transition;
  };
}

function watchLongFrames() {
  const supported = PerformanceObserver.supportedEntryTypes?.includes("long-animation-frame");
  if (!supported) return;
  observer = new PerformanceObserver((list) => loaf.push(...list.getEntries()));
  observer.observe({ type: "long-animation-frame" });
}

/** The camera moves by `rest - dir * spread` px per unit of progress, and `lift` px up. */
function geometryFor(detail: StartDetail): Geometry {
  const probe = document.createElement("div");
  probe.style.transform = "translateX(var(--line-rest))";
  document.body.append(probe);
  const rest = new DOMMatrix(getComputedStyle(probe).transform).m41;
  probe.remove();
  const { measure, chosen } = detail;
  const camX = rest - (chosen ?? 0) * measure.spread;
  const stubEnd = measure.forkY + measure.stem * 1.5;
  const tipY = chosen === null ? 0 : measure.height - stubEnd;
  return { camX, camY: -measure.lift, tipX: chosen === null ? 0 : camX, tipY };
}

function sample(time: number) {
  if (!run?.active) return;
  run.times.push(time);
  run.progress.push(Number(run.stage.style.getPropertyValue("--line-p")));
  requestAnimationFrame(sample);
}

function onStart(event: Event) {
  const stage = event.target as HTMLElement;
  const detail = (event as CustomEvent<StartDetail>).detail;
  const interrupted = run?.active === true;
  if (run) run.active = false;
  run = { stage, detail, begun: performance.now(), ended: 0, times: [], progress: [], interrupted, active: true };
  requestAnimationFrame(sample);
}

function onEnd() {
  if (!run?.active) return;
  const finished = run;
  finished.active = false;
  finished.ended = performance.now();
  // Long-frame entries arrive late, so the summary waits for them.
  window.setTimeout(() => {
    if (run === finished) finalize(finished);
  }, SETTLE_MS);
}

function finalize(finished: Run) {
  const { begun, ended, detail } = finished;
  if (observer) loaf.push(...observer.takeRecords());
  const overlaps = loaf.filter((entry) => entry.startTime + entry.duration >= begun && entry.startTime <= ended);
  const stats = summarize(finished.times, finished.progress, geometryFor(detail), refreshHz);
  const vt = transitions.filter((entry) => entry.begun >= begun - 50 && entry.begun <= ended);
  const swap = swaps.filter((entry) => entry.before >= begun && entry.before <= ended);
  const longest = overlaps.reduce((max, entry) => Math.max(max, entry.duration), 0);
  last = {
    durationMs: round(ended - begun),
    to: detail.to,
    interrupted: finished.interrupted,
    rafFrames: stats.frames,
    avgFps: round(stats.avgFps),
    refreshHz: round(refreshHz),
    droppedFrames: stats.droppedFrames,
    gapMs: { p50: round(stats.gapP50), p95: round(stats.gapP95), max: round(stats.gapMax) },
    tipJumpPx: round(stats.tipJumpPx),
    cameraJumpPx: round(stats.cameraJumpPx),
    longAnimationFrames: observer ? { count: overlaps.length, longestMs: round(longest) } : UNSUPPORTED,
    viewTransition: "startViewTransition" in document
      ? { active: vt.length > 0, ms: vt.length > 0 ? round(vt[0].finished - vt[0].begun) : 0 }
      : UNSUPPORTED,
    swapMs: swap.length > 0 ? round(swap[0].after - swap[0].before) : 0,
    dpr: window.devicePixelRatio,
    browser: browserName(navigator.userAgent),
    renderer: renderer(),
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
  (window as unknown as { __lineDebug: unknown }).__lineDebug = last;
  console.log(JSON.stringify({ lineDebug: last }));
  show();
}

function format(value: unknown): string {
  return typeof value === "object" && value !== null ? JSON.stringify(value).replace(/["{}]/g, "") : String(value);
}

function show() {
  if (!readout) return;
  readout.textContent = last
    ? Object.entries(last).map(([key, value]) => `${key}: ${format(value)}`).join("\n")
    : `waiting for a transition\nrefreshHz: ${round(refreshHz)}`;
  if (overlay) overlay.dataset.state = last ? "done" : "idle";
}

async function copy() {
  const text = JSON.stringify(last ?? { refreshHz: round(refreshHz) });
  const button = overlay?.querySelector("button");
  try {
    await navigator.clipboard.writeText(text);
    if (button) button.textContent = "Copied";
  } catch {
    if (button) button.textContent = "Copy failed, see console";
  }
  window.setTimeout(() => button && (button.textContent = "Copy"), 1500);
}

function attach() {
  if (overlay?.isConnected) return;
  const style = document.createElement("style");
  style.textContent = css;
  overlay = document.createElement("aside");
  overlay.dataset.lineDebug = "";
  overlay.setAttribute("aria-label", "Line debug meter");
  readout = document.createElement("pre");
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Copy";
  button.addEventListener("click", () => void copy());
  overlay.append(style, readout, button);
  document.documentElement.append(overlay);
  show();
}

export function startDebug() {
  attach();
  watchViewTransitions();
  watchLongFrames();
  document.addEventListener("line:transition-start", onStart);
  document.addEventListener("line:transition-end", onEnd);
  document.addEventListener("astro:before-swap", () => swaps.push({ before: performance.now(), after: 0 }));
  document.addEventListener("astro:after-swap", () => {
    const entry = swaps[swaps.length - 1];
    if (entry) entry.after = performance.now();
    attach();
  });
  void measureRefresh().then((hz) => {
    refreshHz = hz;
    show();
  });
}

startDebug();
