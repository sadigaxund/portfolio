const DOC_EXT = /\.(mk\.md|md)$/;

/** Collapses `.` and `..` in a slash path. Returns undefined when it climbs out of the root. */
function collapse(path: string): string | undefined {
  const out: string[] = [];
  for (const part of path.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (out.pop() === undefined) return undefined;
    } else out.push(part);
  }
  return out.join("/");
}

/**
 * Maps a link in a note to the tree URL of the note it names. Links to anything else stay as written.
 * `routes` maps a content path without extension, such as `content/professional/career`, to its URL.
 */
export function makeResolveHref(documentKey: string, routes: Readonly<Record<string, string>>): (href: string) => string | undefined {
  const folder = documentKey.slice(0, documentKey.lastIndexOf("/") + 1);
  return (href) => {
    if (/^([a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(href)) return undefined;
    const [target, ...rest] = href.split(/(?=[#?])/);
    if (!DOC_EXT.test(target)) return undefined;
    const path = collapse(folder + target);
    const url = path === undefined ? undefined : routes[path.replace(DOC_EXT, "")];
    return url === undefined ? undefined : url + rest.join("");
  };
}
