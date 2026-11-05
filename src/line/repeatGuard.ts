import { scrollHeld } from "./scrollHold";

/**
 * Ignores a repeat click on the destination of a running transition. Each click would
 * otherwise restart the move from its slow start, so fast clicks could stall it.
 * A different destination still interrupts. Returns a cleanup.
 */
export function mountRepeatGuard(): () => void {
  let destination: string | null = null;

  const onPrepare = (event: Event) => {
    destination = (event as Event & { to: URL }).to.pathname;
  };

  const onClick = (event: MouseEvent) => {
    if (destination === null || !scrollHeld() || !(event.target instanceof Element)) return;
    const link = event.target.closest("a");
    if (link && new URL(link.href).pathname === destination) event.preventDefault();
  };

  document.addEventListener("astro:before-preparation", onPrepare);
  document.addEventListener("click", onClick, { capture: true });
  return () => {
    document.removeEventListener("astro:before-preparation", onPrepare);
    document.removeEventListener("click", onClick, { capture: true });
  };
}
