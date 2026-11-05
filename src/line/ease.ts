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
