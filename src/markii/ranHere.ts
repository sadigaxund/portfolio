// The site's own record that a visitor refreshed a note in this browser. Markii's memento keys stay markii's.
const PREFIX = "portfolio:ran:";

/** True when this browser has refreshed the note before, so opening it may load the host and run again. */
export function hasRunHere(documentKey: string): boolean {
  try {
    return localStorage.getItem(PREFIX + documentKey) !== null;
  } catch {
    return false;
  }
}

export function markRunHere(documentKey: string): void {
  try {
    localStorage.setItem(PREFIX + documentKey, "1");
  } catch {
    // no record this time
  }
}
