/** The landing hero's measured bottom edge, kept across pages so the world never changes size mid-walk. */
let heroEnd: string | null = null;

function apply(): void {
  if (heroEnd) document.documentElement.style.setProperty("--hero-end", heroEnd);
}

function measureHero(stage: HTMLElement): boolean {
  const hero = document.querySelector<HTMLElement>(".hero");
  if (!hero) return false;
  const next = `${Math.round(hero.getBoundingClientRect().bottom - stage.getBoundingClientRect().top)}px`;
  const changed = next !== heroEnd;
  heroEnd = next;
  apply();
  return changed;
}

/**
 * Sizes the world to the hero as text and width change, so the trunk starts below it.
 * Calls onChange when the measure moved, and returns a cleanup.
 */
export function mountReflow(stage: HTMLElement, onChange: () => void): () => void {
  const watcher = new ResizeObserver(() => {
    if (measureHero(stage)) onChange();
  });
  const watch = () => {
    watcher.disconnect();
    const hero = document.querySelector(".hero");
    if (hero) watcher.observe(hero);
  };
  const onSwap = () => {
    apply();
    watch();
  };
  measureHero(stage);
  watch();
  document.addEventListener("astro:after-swap", onSwap);
  return () => {
    watcher.disconnect();
    document.removeEventListener("astro:after-swap", onSwap);
  };
}
