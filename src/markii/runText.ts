import type { RunOutcome } from "@markii/host";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const relative = new Intl.RelativeTimeFormat("en", { numeric: "always" });
const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** When the values were last refreshed, in words: just now, minutes or hours ago, then the date. */
export function lastRunText(ranAt: number | undefined, now: number, builtLabel: string): string {
  if (ranAt === undefined) return `Values as of ${builtLabel}`;
  const age = Math.max(0, now - ranAt);
  if (age < MINUTE) return "Updated just now";
  if (age < HOUR) return `Updated ${relative.format(-Math.floor(age / MINUTE), "minute")}`;
  if (age < DAY) return `Updated ${relative.format(-Math.floor(age / HOUR), "hour")}`;
  return `Updated ${day.format(ranAt)}`;
}

export interface RunNotice {
  title: string;
  variant: "default" | "success" | "danger";
}

/** The one toast a finished manual run shows. */
export function runNotice(outcome: RunOutcome, builtLabel: string): RunNotice {
  const kept = `Values stay as of ${builtLabel}.`;
  if (outcome.kind !== "ran") return { title: `Could not refresh. ${kept}`, variant: "danger" };
  if (outcome.failures.some((failure) => failure.kind === "capability-denied")) return { title: `Not allowed. ${kept}`, variant: "default" };
  if (outcome.errorCount > 0) return { title: `Could not refresh. ${kept}`, variant: "danger" };
  if (outcome.freshCount === 0) return { title: "No changes. Values are current.", variant: "default" };
  return { title: `Updated ${outcome.freshCount} ${outcome.freshCount === 1 ? "value" : "values"}.`, variant: "success" };
}
