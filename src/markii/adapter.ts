import type { GrantMemento, HostAdapter, HostLabels, HostPromptRequest } from "@markii/host";
import type { BundledPacks } from "./packs";

const LABELS: HostLabels = {
  appNoun: "site",
  previewNoun: "this page",
  diagnosticsSurface: "the browser console",
  deviceNoun: "this browser",
};

export interface AdapterParts {
  readonly isolate: NonNullable<HostAdapter["isolate"]>;
  readonly memento: GrantMemento;
  readonly packs: BundledPacks;
  /** Shows the question and resolves with the answer. With no dialog mounted it answers false. */
  readonly prompt: (request: HostPromptRequest) => Promise<boolean>;
  readonly diagnostics: (line: string) => void;
  readonly now?: () => number;
}

/** The site's host adapter, built over injected parts so a test can swap the isolate and memento. */
export function createAdapter(parts: AdapterParts): HostAdapter {
  const { files } = parts.packs;
  return {
    id: "portfolio",
    labels: LABELS,
    readFile: files.readFile,
    exists: files.exists,
    writeFile: files.writeFile,
    listFolder: files.listFolder,
    prompt: parts.prompt,
    memento: parts.memento,
    diagnostics: parts.diagnostics,
    now: parts.now ?? (() => Date.now()),
    isolate: parts.isolate,
    packs: {
      engine: "react",
      // Visitors never install, so every bundled pack loads and nothing is trusted from a device list.
      trust: "none",
      authorizedFolders: async () => [],
      reservedNamespaces: () => new Set<string>(),
      bundledPacks: () => parts.packs.packs,
    },
  };
}
