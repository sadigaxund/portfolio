// Per-frame jump of the line for an easing curve, with no browser involved.

/** Solves a CSS cubic-bezier(x1, y1, x2, y2) for y at time x by bisection. */
export function bezier(x1, y1, x2, y2) {
  const at = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  return (x) => {
    let low = 0;
    let high = 1;
    for (let i = 0; i < 40; i += 1) {
      const mid = (low + high) / 2;
      if (at(mid, x1, x2) < x) low = mid;
      else high = mid;
    }
    return at((low + high) / 2, y1, y2);
  };
}

export const CURVES = {
  "current [0.16,1,0.3,1]": bezier(0.16, 1, 0.3, 1),
  "ease-in-out cubic [0.65,0,0.35,1]": bezier(0.65, 0, 0.35, 1),
  "ease-in-out sine [0.37,0,0.63,1]": bezier(0.37, 0, 0.63, 1),
};

/** Samples the curve once per frame and returns the largest step in px for the given travel. */
export function peakJump(curve, seconds, fps, travelPx) {
  const frames = Math.ceil(seconds * fps);
  let previous = 0;
  let peak = 0;
  let first = 0;
  let halfAt = 0;
  for (let k = 1; k <= frames; k += 1) {
    const value = curve(Math.min(1, k / fps / seconds));
    peak = Math.max(peak, Math.abs(value - previous) * travelPx);
    if (k === 1) first = value * travelPx;
    if (halfAt === 0 && value >= 0.5) halfAt = k;
    previous = value;
  }
  return { peak, first, halfAt };
}
