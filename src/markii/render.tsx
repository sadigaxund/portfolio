import { Fragment, type ReactElement } from "react";
import { extractScripts, parse } from "@markii/core";
import { renderMarkNode, type Registry } from "@markii/react";
import type { ValueStore } from "@markii/runtime";
import { CodeBlock } from "my-you-eye";
import type { RemoteNote } from "../notes/remote";
import { makeRemoteResolvers, makeResolveHref } from "./links";
import { segmentNote } from "./segments";

/** True when the note holds a script fence, so only those notes ship markii's browser code. */
export function hasScripts(text: string): boolean {
  return extractScripts(parse(text)).length > 0;
}

/** Renders a note's blocks with markii, and its detail lines as `role-detail` paragraphs. */
export function renderNote(
  text: string,
  documentKey: string,
  routes: Readonly<Record<string, string>>,
  registry: Registry,
  store?: ValueStore,
  remote?: RemoteNote,
): ReactElement {
  const root = parse(text);
  const away = remote === undefined ? undefined : makeRemoteResolvers(remote);
  const options = {
    resolveHref: away?.href ?? makeResolveHref(documentKey, routes),
    ...(away && { resolveImageSrc: away.image }),
    renderCode: ({ lang, code }: { lang: string | undefined; code: string }) => <CodeBlock code={code} language={lang} />,
  };
  const render = (children: unknown[]) =>
    renderMarkNode({ ...root, children: children as typeof root.children }, registry, store, undefined, options);
  return (
    <>
      {segmentNote(root.children).map((segment, index) =>
        segment.kind === "detail" ? (
          <p key={index} className="note-detail">
            {render(segment.nodes)}
          </p>
        ) : (
          <Fragment key={index}>{render(segment.nodes)}</Fragment>
        ),
      )}
    </>
  );
}
