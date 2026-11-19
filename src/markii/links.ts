import { blobUrl, rawUrl, type RemoteNote } from "../notes/remote";

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
 * Maps a link in a note to the tree URL of the page it names. Links to anything else stay as written.
 * `routes` maps a content path without extension, such as `content/professional/career`, to its URL.
 * A link may drop the extension to name a section, such as `../professional`. `../` from a top-level folder names the landing page.
 */
export function makeResolveHref(documentKey: string, routes: Readonly<Record<string, string>>): (href: string) => string | undefined {
  const folder = documentKey.slice(0, documentKey.lastIndexOf("/") + 1);
  return (href) => {
    if (/^([a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(href)) return undefined;
    const [target, ...rest] = href.split(/(?=[#?])/);
    const path = collapse(folder + target);
    const url = path === undefined ? undefined : routes[path.replace(DOC_EXT, "")];
    return url === undefined ? undefined : url + rest.join("");
  };
}

const ABSOLUTE = /^([a-z][a-z0-9+.-]*:|\/|#|\?)/i;

/** Resolves a relative image in a local note to its built URL in `images`, keyed like `/content/...`. Absolute sources stay as written. */
export function makeLocalImageResolver(documentKey: string, images: Readonly<Record<string, string>>): (src: string) => string | undefined {
  const folder = documentKey.slice(0, documentKey.lastIndexOf("/") + 1);
  return (src) => {
    if (ABSOLUTE.test(src)) return undefined;
    const path = collapse(folder + src);
    return path === undefined ? undefined : images[`/${path}`];
  };
}

/** Resolvers for a note downloaded from GitHub: a relative link opens on GitHub, and a relative image loads raw. */
export function makeRemoteResolvers(note: RemoteNote): { href: (href: string) => string | undefined; image: (src: string) => string | undefined } {
  const folder = note.path.slice(0, note.path.lastIndexOf("/") + 1);
  const at = (target: string, toUrl: (path: string) => string) => {
    if (ABSOLUTE.test(target)) return undefined;
    const [file, ...rest] = target.split(/(?=[#?])/);
    const path = collapse(folder + file);
    return path === undefined ? undefined : toUrl(path) + rest.join("");
  };
  return { href: (href) => at(href, (path) => blobUrl(note, path)), image: (src) => at(src, (path) => rawUrl(note, path)) };
}
