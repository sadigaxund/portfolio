/** Pure statistics for the line debug meter. No DOM access, so a test can drive it. */

export interface Geometry {
  /** Camera travel in px per unit of progress. */
  camX: number;
  camY: number;
  /** Tip of the chosen branch in px: its screen position is start + slope * progress. */
  tipX: number;
  tipY: number;
}

export interface FrameSummary {
  frames: number;
  avgFps: number;
  droppedFrames: number;
  gapP50: number;
  gapP95: number;
  gapMax: number;
  tipJumpPx: number;
  cameraJumpPx: number;
}

export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const at = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[at];
}

/** Estimates the display refresh rate from idle rAF timestamps, using the median interval. */
export function refreshFromTimes(times: number[]): number {
  const gaps = times.slice(1).map((time, i) => time - times[i]).sort((a, b) => a - b);
  const median = quantile(gaps, 0.5);
  return median > 0 ? 1000 / median : 0;
}

export function summarize(
  times: number[],
  progress: number[],
  geometry: Geometry,
  refreshHz: number,
): FrameSummary {
  const gaps = times.slice(1).map((time, i) => time - times[i]);
  const sorted = [...gaps].sort((a, b) => a - b);
  const interval = refreshHz > 0 ? 1000 / refreshHz : 0;
  const dropped = interval > 0 ? gaps.reduce((sum, gap) => sum + Math.max(0, Math.round(gap / interval) - 1), 0) : 0;
  const span = times.length > 1 ? times[times.length - 1] - times[0] : 0;
  let tip = 0;
  let camera = 0;
  progress.slice(1).forEach((value, i) => {
    const step = Math.abs(value - progress[i]);
    tip = Math.max(tip, Math.hypot(geometry.tipX, geometry.tipY) * step);
    camera = Math.max(camera, Math.hypot(geometry.camX, geometry.camY) * step);
  });
  return {
    frames: times.length,
    avgFps: span > 0 ? ((times.length - 1) * 1000) / span : 0,
    droppedFrames: dropped,
    gapP50: quantile(sorted, 0.5),
    gapP95: quantile(sorted, 0.95),
    gapMax: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
    tipJumpPx: tip,
    cameraJumpPx: camera,
  };
}

export function browserName(ua: string): string {
  const pick = (pattern: RegExp, name: string) => {
    const match = ua.match(pattern);
    return match ? `${name} ${match[1]}` : null;
  };
  return (
    pick(/Firefox\/([\d.]+)/, "Firefox") ??
    pick(/Edg\/([\d.]+)/, "Edge") ??
    pick(/Chrome\/([\d.]+)/, "Chrome") ??
    pick(/Version\/([\d.]+).*Safari/, "Safari") ??
    "unknown"
  );
}
