/** The landing hero's measured bottom edge, kept across pages so the world never changes size mid-walk. */
let heroEnd: string | null = null;

/** Where the fork's labels end, so the landing page reaches past them. They sit outside the page's flow. */
let forkEnd: string | null = null;

function apply(): void {
  if (heroEnd) document.documentElement.style.setProperty("--hero-end", heroEnd);
  if (forkEnd) document.documentElement.style.setProperty("--fork-end", forkEnd);
}

function measureFork(stage: HTMLElement): void {
  if (!document.querySelector(".hero") || stage.dataset.chosen !== "none") return;
  const bottoms = [...stage.querySelectorAll("[data-option]")].map((option) => option.getBoundingClientRect().bottom);
  if (bottoms.length === 0) return;
  forkEnd = `${Math.ceil(Math.max(...bottoms) - stage.getBoundingClientRect().top)}px`;
  apply();
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
    measureFork(stage);
  });
  const watch = () => {
    watcher.disconnect();
    const hero = document.querySelector(".hero");
    if (hero) watcher.observe(hero);
    for (const option of stage.querySelectorAll("[data-option]")) watcher.observe(option);
  };
  const onSwap = () => {
    apply();
    watch();
  };
  measureHero(stage);
  measureFork(stage);
  watch();
  document.addEventListener("astro:after-swap", onSwap);
  return () => {
    watcher.disconnect();
    document.removeEventListener("astro:after-swap", onSwap);
  };
}
