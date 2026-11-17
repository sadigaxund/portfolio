import type { Registry } from "@markii/react";
import { BUNDLED } from "./bundled";

const decoder = new TextDecoder();

/** Builds the render registry from the bundled packs, and adds their stylesheets to the page. */
export async function loadBundledRegistry(base: Registry, report: (line: string) => void): Promise<Registry> {
  for (const reason of BUNDLED.reasons) report(reason);
  if (BUNDLED.packs.length === 0) return base;
  const scripts: string[] = [];
  for (const pack of BUNDLED.packs) {
    scripts.push(decoder.decode(await BUNDLED.files.readFile(pack.scriptPath)));
    if (pack.stylesheetPath !== undefined) {
      const style = document.head.appendChild(document.createElement("style"));
      style.dataset.pack = pack.manifest.name;
      style.textContent = decoder.decode(await BUNDLED.files.readFile(pack.stylesheetPath));
    }
  }
  // The pack runtime pulls in markii's host, so it loads only when a pack ships.
  const { registryFromPackScripts } = await import("./pack-runtime");
  const built = registryFromPackScripts(scripts, base);
  for (const reason of built.reasons) report(reason);
  return built.registry;
}
