const SCROLL_KEYS = new Set([" ", "PageDown", "PageUp", "ArrowUp", "ArrowDown", "Home", "End"]);

const holders = new Set<string>();

// Ctrl plus wheel is zoom, which stays with the browser.
const stopWheel = (event: WheelEvent) => {
  if (!event.ctrlKey) event.preventDefault();
};
const stopTouch = (event: TouchEvent) => event.preventDefault();
const stopKey = (event: KeyboardEvent) => {
  if (SCROLL_KEYS.has(event.key)) event.preventDefault();
};

/**
 * Holds the page still while a transition runs, so a scroll cannot race ahead of the reveal.
 * Input is stopped instead of hiding overflow, because removing the scrollbar would shift the line.
 */
export function holdScroll(holder: string, on: boolean): void {
  const wasHeld = holders.size > 0;
  if (on) holders.add(holder);
  else holders.delete(holder);
  const held = holders.size > 0;
  if (held === wasHeld) return;
  if (held) {
    window.addEventListener("wheel", stopWheel, { passive: false });
    window.addEventListener("touchmove", stopTouch, { passive: false });
    window.addEventListener("keydown", stopKey);
  } else {
    window.removeEventListener("wheel", stopWheel);
    window.removeEventListener("touchmove", stopTouch);
    window.removeEventListener("keydown", stopKey);
  }
}
