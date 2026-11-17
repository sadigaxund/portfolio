import { SETTINGS } from "./config";
import { defaultRegistry } from "@markii/react/components";
import type { Registry } from "@markii/react";
import type { RemoteNote } from "../notes/remote";
import { renderNote } from "./render";

export interface NoteProps {
  text: string;
  documentKey: string;
  routes: Record<string, string>;
  /** Set when the note was downloaded from another repository, so its relative links point there. */
  remote?: RemoteNote;
  /** Defaults to markii's own components. `NoteIslandPacks` and `Note.astro` pass the registry with the packs in it. */
  registry?: Registry;
}

/** A note with no scripts. It renders on the server and ships no markii code. */
export default function NoteBody({ text, documentKey, routes, remote, registry = defaultRegistry }: NoteProps) {
  return (
    <div className="note" data-mk-root="" data-hide-scripts={SETTINGS.hideScriptBlocks || undefined}>
      {renderNote(text, documentKey, routes, registry, undefined, remote)}
    </div>
  );
}
