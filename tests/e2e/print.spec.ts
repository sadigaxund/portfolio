import { expect, test } from "@playwright/test";

const HIDDEN = [".line-stage", ".skip-link", ".leaf-head", ".note-bar", ".markii-credit", '[role="region"][aria-label^="Notifications"]'];

test("a printed leaf drops the screen chrome and keeps the site foot name", async ({ page }) => {
  await page.goto("/projects-blog/projects/mandible");
  await page.locator(".note-bar").waitFor();
  await page.emulateMedia({ media: "print" });
  for (const selector of HIDDEN) {
    const found = await page.locator(selector).count();
    expect(found, `${selector} is in the page`).toBeGreaterThan(0);
    await expect(page.locator(selector).first(), selector).toBeHidden();
  }
  await expect(page.locator(".site-foot-owner > .role-detail")).toContainText("Sadig Akhund");
  const colors = await page.evaluate(() => {
    const style = getComputedStyle(document.querySelector(".leaf-column h1") as Element);
    return { text: style.color, page: getComputedStyle(document.body).backgroundColor };
  });
  expect(colors.text).toBe("rgb(0, 0, 0)");
  expect(["rgba(0, 0, 0, 0)", "rgb(255, 255, 255)"]).toContain(colors.page);
});

test("a printed note link shows its address, and a nav link does not repeat it", async ({ page }) => {
  await page.goto("/projects-blog/projects/mandible");
  await page.emulateMedia({ media: "print" });
  const after = (selector: string) =>
    page.locator(selector).first().evaluate((el) => {
      const content = getComputedStyle(el, "::after").content;
      return { content, href: (el as HTMLAnchorElement).href };
    });
  const prose = await after('.note p a[href^="http"]');
  expect(prose.content).toContain(prose.href);
  const nav = await after("a.mk-nav_link");
  expect(["none", "normal"]).toContain(nav.content);
});
