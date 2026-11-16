import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "my-you-eye";
import { defaultRegistry } from "@markii/react/components";
import type { Registry } from "@markii/react";
import { createValueStore, type StoredValue } from "@markii/runtime";
import type { RunTrigger } from "@markii/runtime";
import { createBrowserHost, type PromptBridge } from "./browser";
import { SETTINGS } from "./config";
import { mergeArrivingValue } from "./merge";
import { loadBundledRegistry } from "./registry";
import { renderNoteParts } from "./render";
import type { NoteProps } from "./NoteBody";

export interface IslandProps extends NoteProps {
  /** The values the build computed, already stale. */
  bakedStale: Record<string, StoredValue>;
  /** When the build ran, as the site words dates. */
  builtLabel: string;
}

/** A note with scripts. It renders on the server, then runs its scripts in the visitor's browser. */
export default function NoteIsland({ text, documentKey, routes, bakedStale, builtLabel }: IslandProps) {
  const prompts = useMemo<PromptBridge>(() => ({ ask: undefined }), []);
  const host = useMemo(() => createBrowserHost(prompts), [prompts]);
  const [values, setValues] = useState<Record<string, StoredValue>>(bakedStale);
  const [registry, setRegistry] = useState<Registry>(defaultRegistry);
  const [running, setRunning] = useState(false);
  const started = useRef(false);

  const run = useCallback(
    async (trigger: RunTrigger) => {
      setRunning(true);
      const outcome = await host.run({
        documentKey,
        text,
        trigger,
        onValue: (name, value) => setValues((current) => mergeArrivingValue(current, name, value)),
      });
      if (outcome.kind !== "ran") console.info(`Run of ${documentKey} ended: ${outcome.kind}`);
      setRunning(false);
    },
    [host, documentKey, text],
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void loadBundledRegistry(defaultRegistry, (line) => console.info(line)).then(setRegistry);
    const remembered = host.lastRun(documentKey).values;
    setValues((current) => ({ ...current, ...remembered }));
    if (SETTINGS.runOnOpen) void run("auto");
  }, [host, documentKey, run]);

  const { head, body } = renderNoteParts(text, documentKey, routes, registry, createValueStore(values));
  return (
    <div className="note" data-mk-root="">
      {head}
      <div className="note-run">
        <Button onClick={() => void run("manual")} disabled={running} aria-busy={running}>
          Run
        </Button>
        <p className="role-detail">Values as of {builtLabel}</p>
      </div>
      {body}
    </div>
  );
}
