import type { ReactElement } from "react";
import { extractScripts, parse } from "@markii/core";
import { renderMarkNode, type Registry } from "@markii/react";
import type { ValueStore } from "@markii/runtime";
import { CodeBlock } from "my-you-eye";
import { makeResolveHref } from "./links";

/** True when the note holds a script fence, so only those notes ship markii's browser code. */
export function hasScripts(text: string): boolean {
  return extractScripts(parse(text)).length > 0;
}

export interface NoteParts {
  /** The first heading alone, or nothing when the note has none. */
  head: ReactElement | undefined;
  body: ReactElement;
}

/** Renders a note in two parts, so the Run button can sit directly under the first heading. */
export function renderNoteParts(
  text: string,
  documentKey: string,
  routes: Readonly<Record<string, string>>,
  registry: Registry,
  store?: ValueStore,
): NoteParts {
  const root = parse(text);
  const options = {
    resolveHref: makeResolveHref(documentKey, routes),
    renderCode: ({ lang, code }: { lang: string | undefined; code: string }) => <CodeBlock code={code} language={lang} />,
  };
  const at = root.children.findIndex((node) => node.type === "heading");
  const render = (children: typeof root.children) => renderMarkNode({ ...root, children }, registry, store, undefined, options);
  if (at === -1) return { head: undefined, body: render(root.children) };
  return { head: render(root.children.slice(0, at + 1)), body: render(root.children.slice(at + 1)) };
}
