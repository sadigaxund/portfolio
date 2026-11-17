import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MarkiiHost, RunOutcome } from "@markii/host";
import type { RunTrigger, StoredValue } from "@markii/runtime";
import type { PromptBridge } from "./browser";
import { SETTINGS } from "./config";
import { mergeRunValue } from "@markii/host";
import { hasRunHere, markRunHere } from "./ranHere";

export interface NoteRun {
  values: Record<string, StoredValue>;
  running: boolean;
  /** When this browser last refreshed the values, or undefined while they are the build's. */
  ranAt: number | undefined;
  /** How many runs have finished since the page opened. */
  runs: number;
  run: (trigger: RunTrigger) => Promise<RunOutcome>;
}

/**
 * Runs a note's scripts through markii's browser host, which loads only on demand: on the first
 * refresh, or on open when this browser has refreshed the note before.
 */
export function useNoteRun(documentKey: string, text: string, bakedStale: Record<string, StoredValue>, prompts: PromptBridge): NoteRun {
  const [values, setValues] = useState(bakedStale);
  const [running, setRunning] = useState(false);
  const [ranAt, setRanAt] = useState<number>();
  const [runs, setRuns] = useState(0);
  const loading = useRef<Promise<MarkiiHost>>(undefined);
  const host = useCallback(() => (loading.current ??= import("./browser").then((module) => module.createBrowserHost(prompts))), [prompts]);

  const run = useCallback(
    async (trigger: RunTrigger) => {
      setRunning(true);
      const loaded = await host();
      const outcome = await loaded.run({
        documentKey,
        text,
        trigger,
        onValue: (name, value) => setValues((current) => mergeRunValue(current, name, value)),
      });
      if (outcome.kind !== "ran") console.info(`Run of ${documentKey} ended: ${outcome.kind}`);
      else if (outcome.failures.some((failure) => failure.kind === "network")) console.warn(`markii: ${documentKey} could not reach the network`);
      if (outcome.kind === "ran" && outcome.freshCount > 0) setRanAt(Date.now());
      if (trigger === "manual") markRunHere(documentKey);
      setRunning(false);
      setRuns((count) => count + 1);
      return outcome;
    },
    [host, documentKey, text],
  );

  useEffect(() => {
    if (!SETTINGS.runOnOpen || !hasRunHere(documentKey)) return;
    void host().then((loaded) => {
      const last = loaded.lastRun(documentKey);
      setValues((current) => ({ ...current, ...last.values }));
      if (last.trace?.ok) setRanAt(last.trace.ranAt);
      return run("auto");
    });
  }, [host, documentKey, run]);

  return useMemo(() => ({ values, running, ranAt, runs, run }), [values, running, ranAt, runs, run]);
}
