import { nextSibling, ROOT, type TreeNode } from "../tree/walk";

/** Directive text is quoted, so a backslash or quote in a name must not end the value early. */
const quote = (text: string) => `"${text.replace(/[\\"]/g, "\\$&")}"`;
const label = (text: string) => text.replace(/[\\[\]{}:]/g, "\\$&");

const link = (name: string, href: string, desc: string) => `::nav_link[${label(name)}]{href=${quote(href)} desc=${quote(desc)} icon=arrow}`;

/** The pager as markii text: Back to the parent, then Next when a sibling follows. Appended to every leaf note. */
export function pagerMarkdown(node: TreeNode): string {
  const parent = node.parent ?? ROOT;
  const next = nextSibling(node);
  const lines = [link(parent === ROOT ? "Start" : parent.label, parent.url, "Back to")];
  if (next) lines.push(link(next.label, next.url, "Next"));
  return `\n\n:::row{cols=2}\n${lines.join("\n")}\n:::\n`;
}
