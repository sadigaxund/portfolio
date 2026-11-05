import { navigate } from "astro:transitions/client";
import type { Direction } from "../tree/tree";
import { BRANCHES, nodeAt, ROOT } from "../tree/walk";
import { scrollHeld } from "./scrollHold";

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

/** The straight branch is the one path a visitor can scroll into, so it is the one they can scroll back from. */
function atStraightBranch(): boolean {
  const node = nodeAt(location.pathname);
  return node?.parent === ROOT && node.direction === 0;
}

/**
 * At the fork, scrolling past the page bottom continues straight on, and arrow keys pick
 * any branch. Scrolling up from the top of the straight branch returns, but only in a gesture
 * that started there, so a fast scroll through a long page never leaves it. Modified keys stay
 * with the browser, because Alt+Left means back. Returns a cleanup.
 */
export function mountIntent(): () => void {
  let wheelTotal = 0;
  let wheelAt = Number.NEGATIVE_INFINITY;
  let startedAtTop = false;
  let touchY: number | null = null;
  let leaving = false;

  const go = (url: string) => {
    if (leaving) return;
    leaving = true;
    void navigate(url);
  };

  const choose = (direction: Direction) => {
    const branch = BRANCHES.find((candidate) => candidate.direction === direction);
    if (branch) go(branch.url);
  };

  const onWheel = (event: WheelEvent) => {
    const fresh = event.timeStamp - wheelAt > WHEEL_IDLE_MS;
    wheelAt = event.timeStamp;
    if (fresh) {
      wheelTotal = 0;
      startedAtTop = scrollY <= 0;
    }
    const pixels = event.deltaY * (event.deltaMode === WheelEvent.DOM_DELTA_LINE ? WHEEL_LINE_PX : 1);
    const forward = pixels > 0 && atFork() && atPageBottom();
    const back = pixels < 0 && startedAtTop && atStraightBranch();
    if (scrollHeld() || event.ctrlKey || !(forward || back)) {
      wheelTotal = 0;
      return;
    }
    wheelTotal += Math.abs(pixels);
    if (wheelTotal < WHEEL_TRIGGER_PX) return;
    if (forward) choose(0);
    else go(ROOT.url);
  };

  const onKey = (event: KeyboardEvent) => {
    if (scrollHeld() || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === "ArrowUp" && atStraightBranch() && scrollY <= 0) {
      event.preventDefault();
      go(ROOT.url);
      return;
    }
    const direction = KEY_DIRECTIONS[event.key];
    if (direction === undefined || !atFork()) return;
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
