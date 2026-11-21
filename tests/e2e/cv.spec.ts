import { expect, test } from "@playwright/test";

test("education is a timeline of logo entries, joined by a rail except below the last", async ({ page }) => {
  await page.goto("/professional/education");
  const entries = page.locator(".mk-cv_entry");
  await expect(entries).toHaveCount(3);
  const got = await entries.evaluateAll((all) =>
    all.map((entry) => {
      const logo = entry.querySelector<HTMLImageElement>(".mk-cv_entry__logo")!;
      const rail = getComputedStyle(entry.querySelector(".mk-cv_entry__rail")!, "::after");
      const heading = entry.querySelector("h2")!.getBoundingClientRect();
      return { logo: logo.complete && logo.naturalWidth > 0, rail: rail.content !== "none", gap: Math.abs(heading.top - logo.getBoundingClientRect().top) };
    }),
  );
  expect(got.map((entry) => entry.logo)).toEqual([true, true, true]);
  expect(got.map((entry) => entry.rail)).toEqual([true, true, false]);
  // The heading starts level with its logo, not below it.
  for (const entry of got) expect(entry.gap).toBeLessThanOrEqual(8);
});

test("an entry's role line is muted detail text", async ({ page }) => {
  await page.goto("/professional/career");
  const line = page.locator(".mk-cv_entry h2 + p").first();
  const [color, muted, style] = await line.evaluate((el) => {
    const probe = document.createElement("span");
    probe.style.color = "var(--mk-muted)";
    el.append(probe);
    const result = [getComputedStyle(el).color, getComputedStyle(probe).color, getComputedStyle(el.querySelector("em")!).fontStyle];
    probe.remove();
    return result;
  });
  expect(color).toBe(muted);
  expect(style).toBe("normal");
});

test("link chips are links at least 44px tall", async ({ page }) => {
  await page.goto("/professional/certifications");
  const chips = page.locator(".mk-page_links a");
  await expect(chips).toHaveCount(3);
  for (const chip of await chips.all()) expect((await chip.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expect(chips.first()).toHaveAttribute("href", /astronomer\.io/);
});

for (const [slug, repo] of [
  ["mandible", "AS-FOSS/mandible"],
  ["git-resume", "AS-FOSS/git-resume"],
  ["markii", "markii-org/markii"],
  ["aqueduct", "sadigaxund/Aqueduct"],
]) {
  test(`${slug} links its repository under the title`, async ({ page }) => {
    await page.goto(`/projects-blog/projects/${slug}`);
    await expect(page.locator(".mk-align-center .mk-page_links a", { hasText: "Repository" })).toHaveAttribute("href", `https://github.com/${repo}`);
  });
}

test("a skill opens to show where it was used, by pointer and by keyboard", async ({ page }) => {
  await page.goto("/professional/skills");
  const spark = page.locator("details.mk-cv_skill", { hasText: "Spark" });
  await expect(spark.locator(".mk-cv_skill__used")).toBeHidden();
  await spark.locator("summary").click();
  await expect(spark.locator(".mk-cv_skill__used")).toHaveText("KDM Force, Ministry of Tourism, Unibank, Aqueduct");
  const trino = page.locator("details.mk-cv_skill", { hasText: "Trino" });
  await trino.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(trino).toHaveAttribute("open", "");
  // A studied tool has no receipts, so it does not open.
  await expect(page.locator("div.mk-cv_skill", { hasText: "dbt" })).toHaveCount(1);
  await expect(page.getByText("Used at work", { exact: true }).first()).toBeVisible();
});
