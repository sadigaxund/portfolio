import { expect, test } from "@playwright/test";

const BASE = "/portfolio";
const PAGES = ["/", "/professional", "/professional/career", "/projects-blog/projects/mandible"];

for (const path of PAGES) {
  test(`${path} serves every file it references under the base path`, async ({ page }) => {
    await page.goto(BASE + path);
    await page.waitForLoadState("networkidle");
    const urls = await page.evaluate(() => {
      const found = new Set<string>();
      const add = (raw: string | null) => {
        if (!raw) return;
        const url = new URL(raw, document.baseURI);
        if (url.origin === location.origin) found.add(url.pathname + url.search);
      };
      document.querySelectorAll("link[href]").forEach((el) => add(el.getAttribute("href")));
      document.querySelectorAll("script[src], img[src]").forEach((el) => add(el.getAttribute("src")));
      document.querySelectorAll("source[srcset]").forEach((el) => {
        (el.getAttribute("srcset") ?? "").split(",").forEach((part) => add(part.trim().split(/\s+/)[0] ?? null));
      });
      return [...found];
    });
    expect(urls.length, "no same-origin files found").toBeGreaterThan(0);
    for (const url of urls) {
      const res = await page.request.get(url);
      expect(res.status(), `GET ${url} on ${path}`).toBe(200);
    }
  });
}

test("every link inside the site stays under the base path", async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(BASE + path);
    const outside = await page.evaluate(
      (base) =>
        [...document.querySelectorAll<HTMLAnchorElement>("a[href^='/']")].map((a) => a.getAttribute("href") ?? "").filter((href) => !href.startsWith(base + "/")),
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

test("the pager links stay under the base path", async ({ page }) => {
  await page.goto(`${BASE}/professional/career`);
  const links = page.locator("[data-mk-root] > .mk-row:last-child .mk-card a");
  await expect(links.nth(0)).toHaveAttribute("href", `${BASE}/professional`);
  await expect(links.nth(1)).toHaveAttribute("href", `${BASE}/professional/education`);
});
