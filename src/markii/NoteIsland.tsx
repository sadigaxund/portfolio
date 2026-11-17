import { useCallback, useMemo } from "react";
import { Toaster, useToast } from "my-you-eye";
import { defaultRegistry } from "@markii/react/components";
import { createValueStore, type StoredValue } from "@markii/runtime";
import type { PromptBridge } from "./browser";
import { SETTINGS } from "./config";
import { GrantDialog } from "./GrantDialog";
import { NoteBar } from "./NoteBar";
import type { NoteProps } from "./NoteBody";
import { LOCAL_IMAGES } from "./localImages";
import { renderNote } from "./render";
import { runNotice } from "./runText";
import { useNoteRun } from "./useNoteRun";

export interface IslandProps extends NoteProps {
  /** The values the build computed, already stale. */
  bakedStale: Record<string, StoredValue>;
  /** When the build ran, as the site words dates. */
  builtLabel: string;
}

function ScriptedNote({ text, documentKey, routes, remote, bakedStale, builtLabel, registry = defaultRegistry }: IslandProps) {
  const prompts = useMemo<PromptBridge>(() => ({ ask: undefined }), []);
  const { values, running, ranAt, runs, run } = useNoteRun(documentKey, text, bakedStale, prompts);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    const notice = runNotice(await run("manual"), builtLabel);
    toast({ title: notice.title, variant: notice.variant });
  }, [run, builtLabel, toast]);

  return (
    <>
      <NoteBar ranAt={ranAt} builtLabel={builtLabel} running={running} runs={runs} onRefresh={() => void refresh()} />
      <div className="note" data-mk-root="" data-hide-scripts={SETTINGS.hideScriptBlocks || undefined}>
        {renderNote(text, documentKey, routes, registry, createValueStore(values), remote, LOCAL_IMAGES)}
      </div>
      <GrantDialog bridge={prompts} />
    </>
  );
}

/** A note with scripts. It renders on the server, then refreshes its values in the visitor's browser on request. */
export default function NoteIsland(props: IslandProps) {
  return (
    <Toaster mobilePlacement="bottom-center" limit={1} duration={5000}>
      <ScriptedNote {...props} />
    </Toaster>
  );
}
