import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test, expect } from "@playwright/test";
import { createMarkiiHost } from "@markii/host";
import {
  assertHostScenario,
  createAnswerQueue,
  listHostScenarioNames,
  loadHostScenario,
  runHostScenario,
} from "@markii/host/conformance";
import { createNodeHostIsolate } from "@markii/host/node";
import { createAdapter } from "../../src/markii/adapter";
import { createMemoryMemento } from "../../src/markii/memento";
import { bundlePacks } from "../../src/markii/packs";

// The scenarios open notes from the package's own folder, so the doubles read the real disk.
const disk = {
  readFile: async (path: string) => new Uint8Array(await readFile(path)),
  exists: (path: string) => stat(path).then(() => true, () => false),
  listFolder: async (path: string) =>
    (await readdir(path, { withFileTypes: true }).catch(() => [])).map((entry) => ({ name: entry.name, isDirectory: entry.isDirectory() })),
  writeFile: async (path: string, bytes: Uint8Array) => {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
  },
};

// The site's adapter over test doubles: the Node isolate for the Web Worker one, an in-memory memento, and the disk.
function adapterFor(answers: { next(): boolean }) {
  return createAdapter({
    isolate: createNodeHostIsolate(),
    memento: createMemoryMemento(),
    packs: { ...bundlePacks({}), files: disk },
    prompt: async () => answers.next(),
    diagnostics: () => {},
  });
}

// The corpus has no way to say "packs are bundled and nothing installs", so the two scenarios that install
// a pack get an install folder here. The site's own adapter has none, because visitors never install.
const NEEDS_INSTALL = new Set(["06-install-pack-then-render", "15-load-packs-engine-views"]);

for (const name of listHostScenarioNames()) {
  test(`scenario ${name}`, async () => {
    const { dir, noteText, scenario, expected } = loadHostScenario(name);
    const base = adapterFor(createAnswerQueue(scenario));
    const root = NEEDS_INSTALL.has(name) ? await mkdtemp(join(tmpdir(), "markii-packs-")) : undefined;
    const withInstall = base.packs && root && {
      ...base.packs,
      installRoot: () => root,
      removeFolder: (path: string) => rm(path, { recursive: true, force: true }),
      authorizedFolders: async () => [root],
    };
    // The corpus words its messages with "this device", which is the one label the site words differently.
    const adapter = { ...base, labels: { ...base.labels, deviceNoun: "this device" }, ...(withInstall ? { packs: withInstall } : {}) };
    const result = await runHostScenario(adapter, scenario, noteText, dir);
    expect(result.promptQueueError).toBeUndefined();
    expect(assertHostScenario(adapter, scenario, expected, result)).toEqual([]);
    if (root) await rm(root, { recursive: true, force: true });
  });
}

test("a script that never ends is killed and the host answers", async () => {
  const adapter = adapterFor({ next: () => false });
  const host = createMarkiiHost(adapter);
  const text = "# Loop\n\n```lua {name=spin}\nwhile true do end\n```\n";
  const outcome = await host.run({ documentKey: "content/loop.mk.md", text, trigger: "auto", timeoutMs: 5000 });
  expect(outcome.kind).toBe("ran");
  if (outcome.kind === "ran") expect(outcome.errorCount).toBe(1);
  const after = await host.run({ documentKey: "content/ok.mk.md", text: "```lua {name=a}\nreturn 1\n```\n", trigger: "auto" });
  expect(after.kind === "ran" && after.freshCount).toBe(1);
});
