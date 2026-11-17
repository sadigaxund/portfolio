import { expect, test } from "@playwright/test";

const BASE = "/portfolio";
const PAGES = ["/", "/professional/", "/professional/career/", "/projects-blog/projects/git-resume/"];

for (const path of PAGES) {
  test(`${path} loads every file it asks the site for under the base path`, async ({ page }) => {
    const missing: string[] = [];
    page.on("response", (res) => {
      const url = new URL(res.url());
      if (url.host === new URL(page.url() || "http://localhost").host && res.status() >= 400) missing.push(`${res.status()} ${url.pathname}`);
    });
    await page.goto(BASE + path);
    await page.waitForLoadState("networkidle");
    expect(missing).toEqual([]);
  });
}

test("every link inside the site stays under the base path", async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(BASE + path);
    const outside = await page.evaluate(
      (base) =>
        [...document.querySelectorAll<HTMLAnchorElement>("a[href^='/']")].map((a) => a.getAttribute("href") ?? "").filter((href) => !href.startsWith(base)),
      BASE,
    );
    expect(outside, path).toEqual([]);
  }
});

test("walking from the start reaches a leaf", async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.locator(".line-option a").nth(1).click();
  await expect(page).toHaveURL(new RegExp(`${BASE}/professional/?$`));
  await page.locator(".stop a").first().click();
  await expect(page.locator("main h1")).toHaveText("Career");
});
