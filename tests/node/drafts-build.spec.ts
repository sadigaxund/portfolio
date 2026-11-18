import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

// One real build with SITE_DRAFTS=hide, written outside dist so the preview server is not disturbed.
test.describe("a build with drafts hidden", () => {
  test.setTimeout(600_000);
  const out = mkdtempSync(join(tmpdir(), "site-hide-"));
  test.afterAll(() => rmSync(out, { recursive: true, force: true }));

  test("leaves the draft roads out of pages and links", () => {
    execFileSync("npx", ["astro", "build", "--outDir", out], { env: { ...process.env, SITE_DRAFTS: "hide" }, stdio: "pipe" });
    for (const gone of ["personal", "personal/instagram", "personal/hobbies/placeholder-leaf", "projects-blog/blog"]) {
      expect(existsSync(join(out, gone, "index.html")), `${gone} is built`).toBe(false);
    }
    expect(existsSync(join(out, "projects-blog/projects/mandible/index.html"))).toBe(true);
    const landing = readFileSync(join(out, "index.html"), "utf8");
    expect(landing).not.toMatch(/href="[^"]*\/personal/);
    expect(landing).not.toContain("Personal");
    expect(landing).not.toContain(`data-branch="-1"`);
    expect(landing).not.toContain(`data-option="-1"`);
    expect(readFileSync(join(out, "projects-blog/index.html"), "utf8")).not.toMatch(/\/blog"/);
    expect(readFileSync(join(out, "projects-blog/projects/aqueduct/index.html"), "utf8")).not.toMatch(/\/projects-blog\/blog/);
  });
});
