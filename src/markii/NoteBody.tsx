import { SETTINGS } from "./config";
import { defaultRegistry } from "@markii/react/components";
import { renderNoteParts } from "./render";

export interface NoteProps {
  text: string;
  documentKey: string;
  routes: Record<string, string>;
}

/** A note with no scripts. It renders on the server and ships no markii code. */
export default function NoteBody({ text, documentKey, routes }: NoteProps) {
  const { head, body } = renderNoteParts(text, documentKey, routes, defaultRegistry);
  return (
    <div className="note" data-mk-root="" data-hide-scripts={SETTINGS.hideScriptBlocks || undefined}>
      {head}
      {body}
    </div>
  );
}
