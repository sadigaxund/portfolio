import * as React from "react";
import { evaluatePackScripts, reactPackEngine, type Registry } from "@markii/react";
import { BUNDLED } from "./bundled";

const decoder = new TextDecoder();

/** Builds the render registry from the bundled packs, and adds their stylesheets to the page. */
export async function loadBundledRegistry(base: Registry, report: (line: string) => void): Promise<Registry> {
  for (const reason of BUNDLED.reasons) report(reason);
  if (BUNDLED.packs.length === 0) return base;
  const scripts: { namespace: string; source: string }[] = [];
  for (const pack of BUNDLED.packs) {
    scripts.push({ namespace: pack.manifest.name, source: decoder.decode(await BUNDLED.files.readFile(pack.scriptPath)) });
    if (pack.stylesheetPath !== undefined) {
      const style = document.head.appendChild(document.createElement("style"));
      style.dataset.pack = pack.manifest.name;
      style.textContent = decoder.decode(await BUNDLED.files.readFile(pack.stylesheetPath));
    }
  }
  // Building the registry pulls in markii's host, so it loads only when a pack ships. It needs 'unsafe-eval'; the site sets no CSP.
  const { buildRenderRegistry } = await import("@markii/host");
  const evaluated = evaluatePackScripts(scripts, { react: React });
  for (const failure of evaluated.failures) report(`pack ${failure.namespace}: ${failure.reason}`);
  const built = buildRenderRegistry(evaluated.registrations, base, reactPackEngine);
  for (const reason of built.invalidReasons) report(reason);
  return built.registry;
}
