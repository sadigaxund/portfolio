import { expect, test } from "@playwright/test";

const CARD = ".mk-page_next__card";

test("the next card is one link: a click in its corner goes to the next page", async ({ page }) => {
  await page.goto("/professional/career");
  await expect(page.locator(CARD)).toHaveCount(1);
  await expect(page.locator(`${CARD} a`)).toHaveCount(1);
  await page.locator(CARD).click({ position: { x: 4, y: 4 } });
  await expect(page).toHaveURL(/\/professional\/education$/);
});

test("the back line leads to the parent, and the last leaf has no next card", async ({ page }) => {
  await page.goto("/professional/certifications");
  await expect(page.locator(".mk-page_back a")).toHaveAttribute("href", "/professional");
  await expect(page.locator(".mk-page_back")).toContainText("Back to");
  await expect(page.locator(CARD)).toHaveCount(0);
});

test("a card with a still shows it decoratively beside the text", async ({ page }) => {
  await page.goto("/projects-blog/projects/mandible");
  const still = page.locator(".mk-page_next__still img");
  await expect(still).toHaveAttribute("alt", "");
  await expect(still).toHaveJSProperty("complete", true);
  await expect(page.locator(`${CARD} a`)).toHaveAttribute("href", "/projects-blog/projects/markii");
});

test("focus and hover mark the whole card with the accent", async ({ page }) => {
  await page.goto("/professional/career");
  const card = page.locator(CARD);
  const accent = await page.evaluate(() => {
    const probe = document.createElement("i");
    probe.style.color = "var(--mk-accent)";
    document.querySelector("[data-mk-root]")!.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  await card.locator("a").focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const focused = await card.evaluate((el) => {
    const css = getComputedStyle(el);
    return { border: css.borderTopColor, outline: css.outlineStyle, width: css.outlineWidth, color: css.outlineColor };
  });
  expect(focused).toEqual({ border: accent, outline: "solid", width: "2px", color: accent });
  await card.hover();
  await expect(card).toHaveCSS("border-top-color", accent);
});

test("the page links do not scroll the page sideways at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const path of ["/professional/career", "/projects-blog/projects/mandible"]) {
    await page.goto(path);
    await page.locator(CARD).scrollIntoViewIfNeeded();
    const wide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(wide, path).toBe(false);
  }
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the links are in the static HTML", async ({ page }) => {
    await page.goto("/professional/career");
    await expect(page.locator(".mk-page_back a")).toHaveAttribute("href", "/professional");
    await expect(page.locator(`${CARD} a`)).toHaveAttribute("href", "/professional/education");
  });
});
