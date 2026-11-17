import { useEffect, useState } from "react";
import { Button, Link } from "my-you-eye";
import { lastRunText } from "./runText";

const MARKII_REPO = "https://github.com/markii-org/markii";

interface NoteBarProps {
  ranAt: number | undefined;
  builtLabel: string;
  running: boolean;
  runs: number;
  onRefresh: () => void;
}

/** The current time, updated once a minute while the tab is visible. */
function useMinuteClock(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") setNow(Date.now());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** False in the server's HTML and until the island hydrates, so an early click never lands on a dead button. */
function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/** The foot of a note with scripts: how old its values are, the refresh control, and the Markii credit. */
export function NoteBar({ ranAt, builtLabel, running, runs, onRefresh }: NoteBarProps) {
  const now = useMinuteClock();
  const hydrated = useHydrated();
  return (
    <div className="note-bar" data-runs={runs}>
      <p className="role-detail note-bar-age" role="status">
        {lastRunText(ranAt, now, builtLabel)}
      </p>
      <Button className="note-bar-refresh" variant="secondary" size="lg" loading={running} disabled={!hydrated || running} onClick={onRefresh}>
        Refresh values
      </Button>
      <p className="role-detail note-bar-credit">
        Written in Markii. <Link href={MARKII_REPO}>Markii on GitHub</Link>
      </p>
    </div>
  );
}
