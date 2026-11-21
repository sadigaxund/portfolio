import { expect, test } from "@playwright/test";

const CARD = ".mk-page_card";
const PREV = ".mk-page_prev .mk-page_card";
const NEXT = ".mk-page_next .mk-page_card";

test("the next card is one link: a click in its corner goes to the next page", async ({ page }) => {
  await page.goto("/professional/career");
  await expect(page.locator(NEXT)).toHaveCount(1);
  await expect(page.locator(`${NEXT} a`)).toHaveCount(1);
  await page.locator(NEXT).click({ position: { x: 4, y: 4 } });
  await expect(page).toHaveURL(/\/professional\/education$/);
});

test("the previous card is one link: a click in its corner goes to the previous page", async ({ page }) => {
  await page.goto("/professional/education");
  await expect(page.locator(PREV)).toHaveCount(1);
  await expect(page.locator(`${PREV} a`)).toHaveCount(1);
  await page.locator(PREV).click({ position: { x: 4, y: 4 } });
  await expect(page).toHaveURL(/\/professional\/career$/);
});

test("the list wraps: the first page's Previous is the last, and the last page's Next is the first", async ({ page }) => {
  await page.goto("/projects-blog/projects/git-resume");
  await expect(page.locator(`${PREV} a`)).toHaveAttribute("href", "/projects-blog/projects/aqueduct");
  await page.goto("/projects-blog/projects/aqueduct");
  await expect(page.locator(`${NEXT} a`)).toHaveAttribute("href", "/projects-blog/projects/git-resume");
  await page.locator(NEXT).click({ position: { x: 4, y: 4 } });
  await expect(page).toHaveURL(/\/projects-blog\/projects\/git-resume$/);
});

test("arrows point the way, and the words Back to, Previous, and Next are for screen readers only", async ({ page }) => {
  await page.goto("/professional/certifications");
  await expect(page.locator(".mk-page_back a")).toHaveAttribute("href", "/professional");
  const hidden = (selector: string) => page.locator(selector).evaluate((el) => el.getBoundingClientRect().width <= 1);
  await expect(page.locator(".mk-page_back__label")).toHaveText("Back to");
  await expect(page.locator(`${PREV} .mk-page_card__label`)).toHaveText("Previous");
  await expect(page.locator(`${NEXT} .mk-page_card__label`)).toHaveText("Next");
  expect(await hidden(".mk-page_back__label")).toBe(true);
  expect(await hidden(`${PREV} .mk-page_card__label`)).toBe(true);
  expect(await hidden(`${NEXT} .mk-page_card__label`)).toBe(true);
  const order = (selector: string) =>
    page.locator(`${selector} .mk-page_card__name`).evaluate((el) => [...el.children].map((child) => child.tagName.toLowerCase()));
  expect(await order(PREV)).toEqual(["svg", "div"]);
  expect(await order(NEXT)).toEqual(["div", "svg"]);
});

test("in a half-width card the still sits on top, and Next is right-aligned", async ({ page }) => {
  await page.goto("/projects-blog/projects/mandible");
  for (const selector of [PREV, NEXT]) {
    const still = page.locator(`${selector} .mk-page_card__still img`);
    await expect(still).toHaveAttribute("alt", "");
    await expect(still).toHaveJSProperty("complete", true);
    const [top, text] = await page.locator(selector).evaluate((el) => [
      el.querySelector(".mk-page_card__still")!.getBoundingClientRect().bottom,
      el.querySelector(".mk-page_card__text")!.getBoundingClientRect().top,
    ]);
    expect(top).toBeLessThanOrEqual(text);
  }
  await expect(page.locator(`${PREV} .mk-page_card__text`)).toHaveCSS("text-align", /^(left|start)$/);
  await expect(page.locator(`${NEXT} .mk-page_card__text`)).toHaveCSS("text-align", "right");
  await expect(page.locator(`${NEXT} a`)).toHaveAttribute("href", "/projects-blog/projects/markii");
});

test("a card with no still is text only", async ({ page }) => {
  await page.goto("/professional/career");
  await expect(page.locator(".mk-page_card__still")).toHaveCount(0);
});

test("focus and hover mark the whole card with the accent", async ({ page }) => {
  await page.goto("/professional/career");
  const accent = await page.evaluate(() => {
    const probe = document.createElement("i");
    probe.style.color = "var(--mk-accent)";
    document.querySelector("[data-mk-root]")!.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  for (const selector of [PREV, NEXT]) {
    const card = page.locator(selector);
    await card.locator("a").focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const focused = await card.evaluate((el) => {
      const css = getComputedStyle(el);
      return { border: css.borderTopColor, outline: css.outlineStyle, width: css.outlineWidth, color: css.outlineColor };
    });
    expect(focused, selector).toEqual({ border: accent, outline: "solid", width: "2px", color: accent });
    await card.hover();
    await expect(card).toHaveCSS("border-top-color", accent);
  }
});

test("the page links do not scroll the page sideways at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const path of ["/professional/career", "/projects-blog/projects/mandible"]) {
    await page.goto(path);
    await page.locator(CARD).first().scrollIntoViewIfNeeded();
    const wide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(wide, path).toBe(false);
  }
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the links are in the static HTML", async ({ page }) => {
    await page.goto("/professional/career");
    await expect(page.locator(".mk-page_back a")).toHaveAttribute("href", "/professional");
    await expect(page.locator(`${NEXT} a`)).toHaveAttribute("href", "/professional/education");
    await expect(page.locator(`${PREV} a`)).toHaveAttribute("href", "/professional/skills");
  });
});
