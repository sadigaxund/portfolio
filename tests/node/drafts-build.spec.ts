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

  test("leaves draft pages out and keeps the pages around them", () => {
    execFileSync("npx", ["astro", "build", "--outDir", out], { env: { ...process.env, SITE_DRAFTS: "hide" }, stdio: "pipe" });
    for (const gone of ["personal/hobbies/gym", "personal/hobbies/violin", "personal/hobbies/blacksmithing", "projects-blog/blog"]) {
      expect(existsSync(join(out, gone, "index.html")), `${gone} is built`).toBe(false);
    }
    for (const here of ["projects-blog/projects/mandible", "personal/hobbies", "personal/hobbies/engineering-science", "personal/hobbies/engineering-science/digital-logic-design", "personal/hobbies/engineering-science/game-design"]) {
      expect(existsSync(join(out, here, "index.html")), `${here} is missing`).toBe(true);
    }
    const landing = readFileSync(join(out, "index.html"), "utf8");
    expect(landing).toContain(`data-option="-1"`);
    expect(landing).toMatch(/\/personal"/);
    const hobbies = readFileSync(join(out, "personal/hobbies/index.html"), "utf8");
    expect(hobbies).toContain("/personal/hobbies/engineering-science");
    expect(hobbies).not.toMatch(/\/personal\/hobbies\/(gym|violin|blacksmithing)/);
    expect(readFileSync(join(out, "projects-blog/index.html"), "utf8")).not.toMatch(/\/blog"/);
    expect(readFileSync(join(out, "projects-blog/projects/aqueduct/index.html"), "utf8")).not.toMatch(/\/projects-blog\/blog/);
  });
});
