import { Fragment, type ReactElement } from "react";
import { parse } from "@markii/core";
import { renderMarkNode, type Registry } from "@markii/react";
import type { ValueStore } from "@markii/runtime";
import { CodeBlock } from "my-you-eye";
import { makeLocalImageResolver, makeResolveHref, type ImageSize } from "./links";
import { segmentNote } from "./segments";

/** Renders a note's blocks with markii, and its detail lines as `role-detail` paragraphs. */
export function renderNote(
  text: string,
  documentKey: string,
  routes: Readonly<Record<string, string>>,
  registry: Registry,
  store?: ValueStore,
  images: Readonly<Record<string, string>> = {},
  sizes: Readonly<Record<string, ImageSize>> = {},
): ReactElement {
  const root = parse(text);
  const options = {
    resolveHref: makeResolveHref(documentKey, routes),
    resolveImageSrc: makeLocalImageResolver(documentKey, images, sizes),
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
