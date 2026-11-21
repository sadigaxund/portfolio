// Compiles each local pack with a src/ folder the way markii-packs does, and copies the result next to its pack.json.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parsePackManifest, packComponentsForEngine } from "@markii/pack";
import { buildPackRegistrationScript } from "@markii/pack-build";

const root = dirname(fileURLToPath(import.meta.url));
const wanted = process.argv.slice(2);
const names = readdirSync(root).filter((name) => existsSync(join(root, name, "src")) && (wanted.length === 0 || wanted.includes(name)));

for (const name of names) {
  const folder = join(root, name);
  const manifestText = readFileSync(join(folder, "pack.json"), "utf8");
  const parsed = parsePackManifest(manifestText);
  if (!parsed.ok) throw new Error(`${name}: ${parsed.errors.join("; ")}`);
  const componentPaths = {};
  for (const listing of packComponentsForEngine(parsed.manifest, "react")) componentPaths[listing.localName] = join(folder, listing.source);
  const cache = join(root, "..", "..", "node_modules", ".cache", `pack-${name}`);
  mkdirSync(cache, { recursive: true });
  const pack = { folder, manifest: parsed.manifest, manifestText, componentPaths, scriptsDir: join(folder, "scripts") };
  const out = await buildPackRegistrationScript(pack, cache);
  if (out.kind !== "built") throw new Error(`${name}: build failed: ${JSON.stringify(out)}`);
  for (const warning of out.warnings ?? []) console.warn(`${name}: warn: ${warning}`);
  copyFileSync(out.scriptPath, join(folder, "webview.js"));
  if (out.stylesheetPath) copyFileSync(out.stylesheetPath, join(folder, "webview.css"));
  console.log(`${name}: built webview.js and webview.css`);
}
