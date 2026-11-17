import type { RunOutcome } from "@markii/host";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const relative = new Intl.RelativeTimeFormat("en", { numeric: "always" });
const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** When the data was last updated, in words that follow "Updated": just now, minutes or hours ago, then the date. */
export function lastRunText(ranAt: number | undefined, now: number, builtLabel: string): string {
  if (ranAt === undefined) return builtLabel;
  const age = Math.max(0, now - ranAt);
  if (age < MINUTE) return "just now";
  if (age < HOUR) return `${relative.format(-Math.floor(age / MINUTE), "minute")}`;
  if (age < DAY) return `${relative.format(-Math.floor(age / HOUR), "hour")}`;
  return `${day.format(ranAt)}`;
}

export interface RunNotice {
  title: string;
  variant: "default" | "success" | "danger";
}

/** The one toast a finished manual run shows. */
export function runNotice(outcome: RunOutcome, builtLabel: string): RunNotice {
  const kept = `Showing data from ${builtLabel}.`;
  if (outcome.kind !== "ran") return { title: `Could not update. ${kept}`, variant: "danger" };
  if (outcome.failures.some((failure) => failure.kind === "capability-denied")) return { title: `Not allowed. ${kept}`, variant: "default" };
  if (outcome.errorCount > 0) return { title: `Could not update. ${kept}`, variant: "danger" };
  if (outcome.freshCount === 0) return { title: "Already up to date.", variant: "default" };
  return { title: "Updated.", variant: "success" };
}
