/** The least space between Back's text and the update controls when they share one header row. */
const GAP_PX = 12;

/**
 * Puts the note bar on a second header row only when it would touch Back on the first.
 * Widths come from the controls' own content, so the answer does not depend on the current layout.
 */
export function watchHeadFit(bar: HTMLElement): () => void {
  const surface = bar.closest<HTMLElement>(".leaf-surface");
  const back = document.querySelector<HTMLElement>("[data-back] a");
  if (!surface || !back) return () => undefined;
  const measure = () => {
    const parts = [...bar.children] as HTMLElement[];
    const gap = parseFloat(getComputedStyle(bar).columnGap) || 0;
    const needed = parts.reduce((sum, part) => sum + part.getBoundingClientRect().width, 0) + gap * (parts.length - 1);
    const right = parseFloat(getComputedStyle(bar).right) || 0;
    const backText = back.getBoundingClientRect().right - (parseFloat(getComputedStyle(back).paddingRight) || 0);
    const room = surface.clientWidth - right - backText - GAP_PX;
    surface.toggleAttribute("data-head-wrap", needed > room);
    surface.toggleAttribute("data-head-fit", needed <= room);
  };
  const watcher = new ResizeObserver(measure);
  for (const part of [surface, back, ...bar.children]) watcher.observe(part);
  measure();
  return () => watcher.disconnect();
}
