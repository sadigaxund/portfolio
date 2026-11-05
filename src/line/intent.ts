import { navigate } from "astro:transitions/client";
import type { Direction } from "../tree/tree";
import { BRANCHES, nodeAt, ROOT } from "../tree/walk";

const WHEEL_TRIGGER_PX = 100;
const WHEEL_IDLE_MS = 200;
const WHEEL_LINE_PX = 40;
const SWIPE_TRIGGER_PX = 60;

const KEY_DIRECTIONS: Record<string, Direction> = { ArrowLeft: -1, ArrowDown: 0, ArrowRight: 1 };

function atPageBottom(): boolean {
  return scrollY + innerHeight >= document.documentElement.scrollHeight - 1;
}

function atFork(): boolean {
  return nodeAt(location.pathname) === ROOT;
}

/**
 * At the fork, scrolling past the page bottom continues straight on, and arrow keys pick
 * any branch. Modified keys stay with the browser, because Alt+Left means back. Returns a cleanup.
 */
export function mountIntent(): () => void {
  let wheelTotal = 0;
  let wheelAt = 0;
  let touchY: number | null = null;
  let leaving = false;

  const choose = (direction: Direction) => {
    const branch = BRANCHES.find((candidate) => candidate.direction === direction);
    if (!branch || leaving) return;
    leaving = true;
    void navigate(branch.url);
  };

  const onWheel = (event: WheelEvent) => {
    if (!atFork() || !atPageBottom() || event.ctrlKey || event.deltaY <= 0) {
      wheelTotal = 0;
      return;
    }
    const pixels = event.deltaY * (event.deltaMode === WheelEvent.DOM_DELTA_LINE ? WHEEL_LINE_PX : 1);
    wheelTotal = event.timeStamp - wheelAt > WHEEL_IDLE_MS ? pixels : wheelTotal + pixels;
    wheelAt = event.timeStamp;
    if (wheelTotal >= WHEEL_TRIGGER_PX) choose(0);
  };

  const onKey = (event: KeyboardEvent) => {
    const direction = KEY_DIRECTIONS[event.key];
    if (direction === undefined || !atFork() || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (direction === 0 && !atPageBottom()) return;
    event.preventDefault();
    choose(direction);
  };

  const onTouchStart = (event: TouchEvent) => {
    touchY = atFork() && atPageBottom() ? event.touches[0].clientY : null;
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (touchY !== null && touchY - event.changedTouches[0].clientY >= SWIPE_TRIGGER_PX) choose(0);
    touchY = null;
  };

  const onSwapped = () => {
    leaving = false;
    wheelTotal = 0;
  };

  document.addEventListener("wheel", onWheel, { passive: true });
  document.addEventListener("keydown", onKey);
  document.addEventListener("touchstart", onTouchStart, { passive: true });
  document.addEventListener("touchend", onTouchEnd, { passive: true });
  document.addEventListener("astro:after-swap", onSwapped);
  return () => {
    document.removeEventListener("wheel", onWheel);
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("touchstart", onTouchStart);
    document.removeEventListener("touchend", onTouchEnd);
    document.removeEventListener("astro:after-swap", onSwapped);
  };
}
