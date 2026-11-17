import * as React from "react";
import { evaluatePackScripts, reactPackEngine, type Registry } from "@markii/react";
import { buildRenderRegistry } from "@markii/host";
import type { BundledPacks } from "./packs";

const decoder = new TextDecoder();

export interface PackRegistry {
  registry: Registry;
  /** One stylesheet text per pack that ships one, keyed by pack namespace. */
  styles: Record<string, string>;
}

/** Builds the render registry from the bundled packs. It runs in Node at build and in the browser, and touches no DOM. */
export async function buildPackRegistry(bundled: BundledPacks, base: Registry, report: (line: string) => void): Promise<PackRegistry> {
  for (const reason of bundled.reasons) report(reason);
  const scripts: { namespace: string; source: string }[] = [];
  const styles: Record<string, string> = {};
  for (const pack of bundled.packs) {
    scripts.push({ namespace: pack.manifest.name, source: decoder.decode(await bundled.files.readFile(pack.scriptPath)) });
    if (pack.stylesheetPath !== undefined) styles[pack.manifest.name] = decoder.decode(await bundled.files.readFile(pack.stylesheetPath));
  }
  if (scripts.length === 0) return { registry: base, styles };
  // Evaluating a pack script needs 'unsafe-eval'; the site sets no CSP.
  const evaluated = evaluatePackScripts(scripts, { react: React });
  for (const failure of evaluated.failures) report(`pack ${failure.namespace}: ${failure.reason}`);
  const built = buildRenderRegistry(evaluated.registrations, base, reactPackEngine);
  for (const reason of built.invalidReasons) report(reason);
  return { registry: built.registry, styles };
}

/** The packs a note names, by their `namespace_component` directive names. */
export function packNamespacesUsed(bundled: BundledPacks, text: string): string[] {
  return bundled.packs.map((pack) => pack.manifest.name).filter((name) => text.includes(`${name}_`));
}
