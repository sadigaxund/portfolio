// Parses a Chromium trace of one line transition. Times in the trace are microseconds.

const FRAME_MS = 1000 / 60;
const LATE_US = 100_000;
const COST_EVENTS = ["FireAnimationFrame", "UpdateLayoutTree", "Layout", "PrePaint", "Paint", "Layerize", "Commit", "RasterTask"];

const ms = (us) => us / 1000;
const median = (list) => {
  if (list.length === 0) return 0;
  const sorted = [...list].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)];
};
const gapsOf = (times) => times.slice(1).map((time, i) => ms(time - times[i]));

// Chromium reports an unclipped paint as a +-8M px box, which is no area at all.
const LIMIT = 1e5;

function bounded(clip) {
  if (!Array.isArray(clip) || clip.length < 8 || clip.some((value) => Math.abs(value) > LIMIT)) return 0;
  return Math.abs(clip[2] - clip[0]) * Math.abs(clip[5] - clip[3]);
}

function paintedNodes(paints, frames) {
  const counts = {};
  for (const e of paints) {
    const key = e.args?.data?.nodeName ?? "?";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).map(([key, count]) => [key, count / frames]));
}

/**
 * Returns presented and dropped frames, frame gaps, and main-thread cost for the window between
 * the page's line:transition-start and line:transition-end marks.
 */
export function parseTrace(events, { fallbackMs = 1200 } = {}) {
  const start = events.find((event) => event.name === "line:transition-start");
  const end = events.find((event) => event.name === "line:transition-end");
  if (!start) return { error: "no line:transition-start mark in the trace" };
  const t0 = start.ts;
  const t1 = end ? end.ts : t0 + fallbackMs * 1000;
  const inside = (event) => event.ts >= t0 && event.ts <= t1;
  const renderer = start.pid;
  const mainThread = (event) => event.pid === renderer && event.tid === start.tid;

  const ticks = events.filter((e) => e.name === "FireAnimationFrame" && e.pid === renderer && inside(e));
  const displays = events.filter((e) => e.name === "Display::FrameDisplayed" && e.ts >= t0 && e.ts <= t1 + LATE_US).map((e) => e.ts).sort((a, b) => a - b);
  const shown = displays.filter((ts) => ts <= t1);
  // A line frame is the first display after a main-thread commit. Compositor-only frames are not counted.
  const commits = events.filter((e) => e.name === "ProxyMain::BeginMainFrame::commit" && e.ph === "X" && e.pid === renderer && inside(e));
  const lineShown = [...new Set(commits.map((c) => displays.find((ts) => ts > c.ts)).filter((ts) => ts !== undefined))];
  const reporters = events.filter(
    (e) => e.name === "PipelineReporter" && e.ph === "b" && e.pid === renderer && inside(e),
  );
  const states = {};
  for (const reporter of reporters) {
    const state = reporter.args?.frame_reporter?.state ?? "unknown";
    states[state] = (states[state] ?? 0) + 1;
  }
  const mainFrames = events.filter((e) => e.name === "ProxyMain::BeginMainFrame" && e.ph === "X" && mainThread(e) && inside(e));
  const frameMs = mainFrames.map((e) => ms(e.dur));
  const tasks = events.filter((e) => e.name === "RunTask" && e.ph === "X" && mainThread(e) && inside(e));

  const totals = {};
  for (const name of COST_EVENTS) {
    const matching = events.filter((e) => e.name === name && e.ph === "X" && inside(e));
    totals[name] = ms(matching.reduce((sum, e) => sum + e.dur, 0));
  }
  const frames = Math.max(1, mainFrames.length);
  const perFrame = Object.fromEntries(Object.entries(totals).map(([name, total]) => [name, total / frames]));
  const topEvent = Object.entries(perFrame).sort((a, b) => b[1] - a[1])[0];
  const paints = events.filter((e) => e.name === "Paint" && e.ph === "X" && inside(e));

  return {
    windowMs: ms(t1 - t0),
    completed: Boolean(end),
    ticks: ticks.length,
    tickWorstGapMs: Math.max(0, ...gapsOf(ticks.map((e) => e.ts))),
    commits: commits.length,
    presented: lineShown.length,
    screenFrames: shown.length,
    screenWorstGapMs: Math.max(0, ...gapsOf(shown)),
    lost: Math.max(0, Math.round(ms(t1 - t0) / FRAME_MS) - lineShown.length),
    dropped: states.STATE_DROPPED ?? 0,
    states,
    worstGapMs: Math.max(0, ...gapsOf(lineShown)),
    mainFrames: mainFrames.length,
    mainMedianMs: median(frameMs),
    mainWorstMs: Math.max(0, ...frameMs),
    longestTaskMs: Math.max(0, ...tasks.map((e) => ms(e.dur))),
    perFrame,
    topEvent: topEvent ? `${topEvent[0]} ${topEvent[1].toFixed(2)}` : "none",
    paintEventsPerFrame: paints.length / frames,
    paintAreaMpxPerFrame: paints.reduce((sum, e) => sum + bounded(e.args?.data?.clip), 0) / frames / 1e6,
    paintedNodes: paintedNodes(paints, frames),
    softwareCompositor: events.some((e) => e.name === "SoftwareRenderer::DoDrawQuad"),
  };
}

export { median };
