import { expect, test } from "@playwright/test";
import { createReadOnlyFiles } from "../../src/markii/files";
import { makeResolveHref } from "../../src/markii/links";
import { bundlePacks } from "../../src/markii/packs";
import { parseSettings } from "../../src/markii/settings";

const good = { allowedOrigins: ["https://api.github.com"], runOnOpen: true, hideScriptBlocks: true };

test.describe("settings", () => {
  test("accepts the shipped shape", () => {
    expect(parseSettings(good)).toEqual(good);
  });
  test("names an unknown key", () => {
    expect(() => parseSettings({ ...good, refresh: 5 })).toThrow("markii/settings.json: (root).refresh is not a known key");
  });
  test("names a wrong type", () => {
    expect(() => parseSettings({ ...good, runOnOpen: "yes" })).toThrow("runOnOpen must be true or false");
    expect(() => parseSettings({ ...good, hideScriptBlocks: 1 })).toThrow("hideScriptBlocks must be true or false");
    expect(() => parseSettings({ ...good, allowedOrigins: "https://api.github.com" })).toThrow("allowedOrigins must be a list");
    expect(() => parseSettings({ ...good, allowedOrigins: [3] })).toThrow("allowedOrigins[0] must be a string");
  });
  test("refuses an origin with a path", () => {
    expect(() => parseSettings({ ...good, allowedOrigins: ["https://api.github.com/repos"] })).toThrow("allowedOrigins[0]");
  });
});

test.describe("makeResolveHref", () => {
  const routes = { "content/projects-blog/projects/aqueduct": "/projects-blog/projects/aqueduct", "content/professional/career": "/professional/career" };
  const resolve = makeResolveHref("content/projects-blog/projects/markii.mk.md", routes);

  test("maps a relative link to a note onto its tree URL", () => {
    expect(resolve("./aqueduct.md")).toBe("/projects-blog/projects/aqueduct");
    expect(resolve("../../professional/career.mk.md#kdm")).toBe("/professional/career#kdm");
  });
  test("maps a link without an extension onto a section or the landing page", () => {
    const withSections = makeResolveHref("content/projects-blog/projects/markii.mk.md", { ...routes, "content/projects-blog/projects": "/projects-blog/projects", content: "/" });
    expect(withSections("../projects")).toBe("/projects-blog/projects");
    expect(withSections("../..")).toBe("/");
  });
  test("leaves every other link alone", () => {
    for (const href of ["https://example.com/a.md", "#top", "/professional/career", "./missing.md", "./photo.png", "../../../../x.md"]) {
      expect(resolve(href)).toBeUndefined();
    }
  });
});

test.describe("bundled packs", () => {
  const manifest = JSON.stringify({ name: "demo", engine: "react", version: "1.0.0", components: {} });

  test("no files means no packs and no complaint", () => {
    const bundled = bundlePacks({});
    expect(bundled.packs).toEqual([]);
    expect(bundled.reasons).toEqual([]);
  });
  test("a valid pack is handed over with its script path", () => {
    const bundled = bundlePacks({ "/markii/packs/demo/pack.json": manifest, "/markii/packs/demo/webview.js": "1" });
    expect(bundled.packs.map((pack) => pack.scriptPath)).toEqual(["/packs/demo/webview.js"]);
  });
  test("a folder whose manifest names another namespace is reported", () => {
    const bundled = bundlePacks({ "/markii/packs/other/pack.json": manifest });
    expect(bundled.packs).toEqual([]);
    expect(bundled.reasons[0]).toContain("pack other");
  });
});

test.describe("read-only files", () => {
  const files = createReadOnlyFiles({ "/packs/demo/pack.json": "{}" });

  test("reads, lists, and refuses a write", async () => {
    expect(new TextDecoder().decode(await files.readFile("/packs/demo/pack.json"))).toBe("{}");
    expect(await files.exists("/packs/demo")).toBe(true);
    expect(await files.listFolder("/packs")).toEqual([{ name: "demo", isDirectory: true }]);
    expect(await files.listFolder("/nowhere")).toEqual([]);
    await expect(files.writeFile("/packs/x", new Uint8Array())).rejects.toThrow("read-only");
  });
});
