import type { DiscoveredPack } from "@markii/host";
import { parsePackManifest } from "@markii/pack";
import { createReadOnlyFiles, type ReadOnlyFiles } from "./files";

export interface BundledPacks {
  files: ReadOnlyFiles;
  packs: DiscoveredPack[];
  /** One line per pack folder that did not load, for the browser console. */
  reasons: string[];
}

const FILE = /^\/markii\/packs\/([^/]+)\/(pack\.json|webview\.js|webview\.css)$/;

/** Turns the pack files' text, keyed like `/markii/packs/<namespace>/pack.json`, into the packs the host is handed. */
export function bundlePacks(sources: Readonly<Record<string, string>>): BundledPacks {
  const files: Record<string, string> = {};
  for (const [path, text] of Object.entries(sources)) {
    const match = FILE.exec(path);
    if (match) files[`/packs/${match[1]}/${match[2]}`] = text;
  }
  const packs: DiscoveredPack[] = [];
  const reasons: string[] = [];
  const namespaces = new Set(Object.keys(files).map((path) => path.split("/")[2]));
  for (const namespace of namespaces) {
    const folder = `/packs/${namespace}`;
    const manifestText = files[`${folder}/pack.json`];
    const parsed = manifestText === undefined ? undefined : parsePackManifest(manifestText);
    if (!parsed?.ok) {
      reasons.push(`pack ${namespace}: ${parsed ? parsed.errors.join("; ") : "pack.json is missing"}`);
      continue;
    }
    if (parsed.manifest.name !== namespace) {
      reasons.push(`pack ${namespace}: pack.json names "${parsed.manifest.name}", and the folder must match`);
      continue;
    }
    packs.push({
      folder,
      manifest: parsed.manifest,
      manifestText,
      componentPaths: {},
      scriptsDir: `${folder}/scripts`,
      scriptPath: `${folder}/webview.js`,
      stylesheetPath: files[`${folder}/webview.css`] === undefined ? undefined : `${folder}/webview.css`,
    });
  }
  return { files: createReadOnlyFiles(files), packs, reasons };
}
