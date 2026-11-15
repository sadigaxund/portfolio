import type { HostDirEntry } from "@markii/host";

const encoder = new TextEncoder();

const normalize = (path: string): string => "/" + path.split("/").filter((part) => part !== "" && part !== ".").join("/");

export interface ReadOnlyFiles {
  readFile(path: string): Promise<Uint8Array>;
  exists(path: string): Promise<boolean>;
  listFolder(path: string): Promise<readonly HostDirEntry[]>;
  writeFile(path: string, bytes: Uint8Array): Promise<void>;
}

/** A read-only file tree over text files, keyed by absolute path such as `/packs/ns/pack.json`. Nothing writes to it. */
export function createReadOnlyFiles(files: Readonly<Record<string, string>>): ReadOnlyFiles {
  const byPath = new Map(Object.entries(files).map(([path, text]) => [normalize(path), text]));
  const folders = new Set<string>(["/"]);
  for (const path of byPath.keys()) {
    const parts = path.split("/").filter(Boolean);
    for (let i = 1; i < parts.length; i += 1) folders.add("/" + parts.slice(0, i).join("/"));
  }
  return {
    async readFile(path) {
      const text = byPath.get(normalize(path));
      if (text === undefined) throw new Error(`no such file: ${path}`);
      return encoder.encode(text);
    },
    async exists(path) {
      const key = normalize(path);
      return byPath.has(key) || folders.has(key);
    },
    async listFolder(path) {
      const key = normalize(path);
      const prefix = key === "/" ? "/" : key + "/";
      const names = new Map<string, boolean>();
      for (const entry of [...byPath.keys(), ...folders]) {
        if (!entry.startsWith(prefix) || entry === key) continue;
        const rest = entry.slice(prefix.length);
        const slash = rest.indexOf("/");
        names.set(slash === -1 ? rest : rest.slice(0, slash), slash !== -1 || folders.has(entry));
      }
      return [...names].map(([name, isDirectory]) => ({ name, isDirectory }));
    },
    // Nothing calls this. A write fails loudly rather than pretending.
    writeFile: () => Promise.reject(new Error("the bundled pack files are read-only")),
  };
}
