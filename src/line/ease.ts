const EASES = {
  sine: "cubic-bezier(0.37, 0, 0.63, 1)",
  cubic: "cubic-bezier(0.65, 0, 0.35, 1)",
  fast: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

/** Reads ?ease= at mount, so curves can be compared side by side. */
export function chooseEase(): string {
  const name = new URLSearchParams(location.search).get("ease");
  return name === "cubic" || name === "fast" ? EASES[name] : EASES.sine;
}

/** The share of a walk's time at which a cubic-bezier ease reaches a share of its distance. */
export function timeAt(ease: string, progress: number): number {
  const [x1, y1, x2, y2] = (ease.match(/[\d.]+/g) ?? ["0", "0", "1", "1"]).map(Number);
  const point = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  const target = Math.min(Math.max(progress, 0), 1);
  let low = 0;
  let high = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    if (point(y1, y2, mid) < target) low = mid;
    else high = mid;
  }
  return point(x1, x2, (low + high) / 2);
}
