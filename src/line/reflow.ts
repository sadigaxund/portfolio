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
  // The labels move a frame after the hero resizes, and a web font can resize it after load.
  const measureForkSoon = () => requestAnimationFrame(() => measureFork(stage));
  const watcher = new ResizeObserver(() => {
    if (measureHero(stage)) onChange();
    measureFork(stage);
    measureForkSoon();
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
  void document.fonts.ready.then(measureForkSoon);
  watch();
  // A walk back to the fork measures nothing until the stage is at rest there.
  const atRest = new MutationObserver(measureForkSoon);
  atRest.observe(stage, { attributeFilter: ["data-chosen"] });
  document.addEventListener("astro:after-swap", onSwap);
  return () => {
    watcher.disconnect();
    atRest.disconnect();
    document.removeEventListener("astro:after-swap", onSwap);
  };
}
