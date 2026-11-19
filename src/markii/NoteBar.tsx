import { useEffect, useRef, useState } from "react";
import { Button } from "my-you-eye";
import { watchHeadFit } from "./headFit";
import { lastRunText } from "./runText";

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

/** A note's update controls in the leaf header: how old its data is, and Update. A phone drops the leading "Updated". */
export function NoteBar({ ranAt, builtLabel, running, runs, onRefresh }: NoteBarProps) {
  const now = useMinuteClock();
  const hydrated = useHydrated();
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => (bar.current ? watchHeadFit(bar.current) : undefined), []);
  return (
    <div ref={bar} className="note-bar" data-runs={runs}>
      <p className="role-detail note-bar-age" role="status">
        <span className="note-bar-lead">Updated </span>
        {lastRunText(ranAt, now, builtLabel)}
      </p>
      <Button className="note-bar-refresh" variant="secondary" size="md" loading={running} disabled={!hydrated || running} onClick={onRefresh}>
        Update
      </Button>
    </div>
  );
}
