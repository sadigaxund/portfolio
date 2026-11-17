import type { parse } from "@markii/core";

type Block = ReturnType<typeof parse>["children"][number];

/** A run of blocks markii renders as is, or a detail line the site renders in `role-detail`. */
export type Segment = { kind: "blocks"; nodes: Block[] } | { kind: "detail"; nodes: unknown[] };

/** A paragraph written as one emphasis run, such as `*Data engineer. Baku. 2021 to 2022.*`, is a detail line. */
function detailContent(node: Block): unknown[] | undefined {
  if (node.type !== "paragraph" || node.children.length !== 1) return undefined;
  const [only] = node.children;
  return only.type === "emphasis" ? only.children : undefined;
}

/** Splits a note's top-level blocks into detail lines and the runs between them. */
export function segmentNote(children: readonly Block[]): Segment[] {
  const segments: Segment[] = [];
  for (const node of children) {
    const detail = detailContent(node);
    const last = segments.at(-1);
    if (detail !== undefined) segments.push({ kind: "detail", nodes: detail });
    else if (last?.kind === "blocks") last.nodes.push(node);
    else segments.push({ kind: "blocks", nodes: [node] });
  }
  return segments;
}
