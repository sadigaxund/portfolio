/** Moves focus to the new page's heading once it shows, so keyboard and screen reader visitors start there. */
export function focusArrival(): void {
  const heading = document.querySelector<HTMLElement>("main h1");
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}
