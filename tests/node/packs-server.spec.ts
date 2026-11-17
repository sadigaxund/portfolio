import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { defaultRegistry } from "@markii/react/components";
import { bundlePacks } from "../../src/markii/packs";
import { buildPackRegistry, packNamespacesUsed } from "../../src/markii/registry";
import { renderNote } from "../../src/markii/render";

const FILES = ["pack.json", "webview.js", "webview.css"];
const bundled = bundlePacks(Object.fromEntries(FILES.map((name) => [`/markii/packs/nav/${name}`, readFileSync(`markii/packs/nav/${name}`, "utf8")])));

const NOTE = [
  ':::nav_group{title="Links"}',
  '::nav_link[repository]{href="https://example.com/repo"}',
  '::nav_link[live demo]{href="https://example.com/demo" icon="arrow"}',
  ":::",
].join("\n");

test.describe("packs on the server", () => {
  test("the bundled nav pack loads with no reasons", () => {
    expect(bundled.reasons).toEqual([]);
    expect(bundled.packs.map((pack) => pack.manifest.name)).toEqual(["nav"]);
  });

  test("a note that names a pack is detected", () => {
    expect(packNamespacesUsed(bundled, NOTE)).toEqual(["nav"]);
    expect(packNamespacesUsed(bundled, "plain text")).toEqual([]);
  });

  test("a nav group and its links render to static HTML with no fallback", async () => {
    const reports: string[] = [];
    const { registry, styles } = await buildPackRegistry(bundled, defaultRegistry, (line) => reports.push(line));
    expect(reports).toEqual([]);
    expect(styles.nav).toContain("{");
    const html = renderToStaticMarkup(renderNote(NOTE, "content/test", {}, registry));
    expect(html).toContain("Links");
    expect(html).toContain('href="https://example.com/repo"');
    expect(html).toContain("repository");
    expect(html).toContain("live demo");
    expect(html).not.toMatch(/unknown|fallback|not found|mk-unknown/i);
  });

  test("the same note with only markii's own components shows the fallback", () => {
    const html = renderToStaticMarkup(renderNote(NOTE, "content/test", {}, defaultRegistry));
    expect(html).toMatch(/nav_group|nav_link/);
  });
});
