import { asRecord, asString, fail } from "../tree/check";

/** A note kept in another GitHub repository and downloaded at build time. */
export interface RemoteNote {
  /** `owner/name` on GitHub. */
  repo: string;
  /** A branch, tag, or commit. */
  ref: string;
  /** The note's path inside the repository, ending in `.md` or `.mk.md`. */
  path: string;
}

const KEYS = ["repo", "ref", "path"] as const;

/** Turns a parsed `<leaf>.remote.yaml` into a reference, or throws naming the bad key. */
export function parseRemoteNote(file: string, data: unknown): RemoteNote {
  const record = asRecord(file, "(root)", data, KEYS);
  const repo = asString(file, "repo", record.repo);
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) fail(file, "repo", `must be owner/name, such as markii-org/markii-vault, but is "${repo}"`);
  const ref = asString(file, "ref", record.ref);
  const path = asString(file, "path", record.path);
  if (path.startsWith("/") || path.split("/").includes("..")) fail(file, "path", "must be relative to the repository root");
  if (!/\.(mk\.md|md)$/.test(path)) fail(file, "path", "must end in .md or .mk.md");
  return { repo, ref, path };
}

/** Where the raw file is served, and where a relative link inside it points. */
export function rawUrl(note: RemoteNote, path = note.path): string {
  return `https://raw.githubusercontent.com/${note.repo}/${note.ref}/${path}`;
}

export function blobUrl(note: RemoteNote, path = note.path): string {
  return `https://github.com/${note.repo}/blob/${note.ref}/${path}`;
}

/** Downloads the note. Any answer but 200 throws, so a moved or deleted file fails the build. */
export async function fetchRemoteNote(file: string, note: RemoteNote, get: typeof fetch = fetch): Promise<string> {
  const url = rawUrl(note);
  let response: Response;
  try {
    response = await get(url);
  } catch (error) {
    throw new Error(`${file}: could not download ${url} (${error instanceof Error ? error.message : String(error)})`, { cause: error });
  }
  if (!response.ok) throw new Error(`${file}: ${url} answered ${response.status}; the file may have moved or been deleted`);
  return response.text();
}
