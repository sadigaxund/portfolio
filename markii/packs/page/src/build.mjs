// Compiles this pack the way markii-packs does, and copies the result next to pack.json.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parsePackManifest, packComponentsForEngine } from "@markii/pack";
import { buildPackRegistrationScript } from "@markii/pack-build";
import { readFileSync } from "node:fs";

const folder = dirname(dirname(fileURLToPath(import.meta.url)));
const manifestText = readFileSync(join(folder, "pack.json"), "utf8");
const parsed = parsePackManifest(manifestText);
if (!parsed.ok) throw new Error(parsed.errors.join("; "));
const componentPaths = {};
for (const listing of packComponentsForEngine(parsed.manifest, "react")) componentPaths[listing.localName] = join(folder, listing.source);
const cache = join(folder, "..", "..", "..", "node_modules", ".cache", "pager-pack");
mkdirSync(cache, { recursive: true });
const pack = { folder, manifest: parsed.manifest, manifestText, componentPaths, scriptsDir: join(folder, "scripts") };
const out = await buildPackRegistrationScript(pack, cache);
if (out.kind !== "built") throw new Error(`build failed: ${JSON.stringify(out)}`);
for (const w of out.warnings ?? []) console.warn(`warn: ${w}`);
copyFileSync(out.scriptPath, join(folder, "webview.js"));
if (out.stylesheetPath) copyFileSync(out.stylesheetPath, join(folder, "webview.css"));
console.log("built webview.js and webview.css");
