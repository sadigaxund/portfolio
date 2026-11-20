import { expect, test, type Page } from "@playwright/test";

async function tabOrder(page: Page, count: number): Promise<string[]> {
  const names: string[] = [];
  for (let step = 0; step < count; step += 1) {
    await page.keyboard.press("Tab");
    names.push(await page.evaluate(() => document.activeElement?.textContent?.trim() ?? ""));
  }
  return names;
}

test("the landing page reaches the contact links before the roads", async ({ page }) => {
  await page.goto("/");
  expect(await tabOrder(page, 5)).toEqual(["Resume", "Email", "GitHub", "LinkedIn", "Personal"]);
});

test("a page below the start offers skip and then Back first", async ({ page }) => {
  await page.goto("/professional");
  expect(await tabOrder(page, 2)).toEqual(["Skip to content", "Back to Home"]);
});

test("only leaves have a site foot", async ({ page }) => {
  for (const path of ["/", "/professional"]) {
    await page.goto(path);
    await expect(page.locator(".site-foot")).toHaveCount(0);
  }
  for (const path of ["/professional/career", "/projects-blog/projects/git-resume"]) {
    await page.goto(path);
    await expect(page.locator("footer.site-foot .contact-links a")).toHaveCount(4);
  }
});

test("after a walk, focus starts at the new page's heading", async ({ page }) => {
  await page.goto("/professional");
  await page.locator(".stop a").first().focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/professional\/career$/);
  await expect(page.locator("main h1")).toBeFocused({ timeout: 10000 });
});

test("Back sits in a navigation landmark", async ({ page }) => {
  await page.goto("/professional");
  await expect(page.getByRole("navigation", { name: "Back" }).getByRole("link")).toHaveText("Back to Home");
});

test("Back shows an arrow and the parent's name, and keeps that name after a walk", async ({ page }) => {
  await page.goto("/professional");
  await page.waitForSelector(".line-stage[data-ready]");
  const back = page.locator("[data-back] a");
  await expect(back.locator("svg")).toHaveCount(1);
  await expect(back.locator("[data-back-name]")).toHaveText("Home");
  expect(await back.locator(".sr-only").evaluate((el) => el.getBoundingClientRect().width <= 1)).toBe(true);
  await page.getByRole("link", { name: "Career" }).first().click();
  await expect(page.locator("h1")).toHaveText("Career");
  await expect(back.locator("[data-back-name]")).toHaveText("Professional");
  await expect(back).toHaveAccessibleName("Back to Professional");
});

test("a short leaf keeps its foot in the window", async ({ page }) => {
  await page.goto("/personal/instagram");
  const foot = await page.locator("footer.site-foot").boundingBox();
  const height = page.viewportSize()!.height;
  expect(foot!.y + foot!.height).toBeLessThanOrEqual(height + 1);
  expect(foot!.y + foot!.height).toBeGreaterThanOrEqual(height - 1);
});

for (const viewport of [{ width: 360, height: 740 }, { width: 320, height: 640 }, { width: 1280, height: 800 }]) {
  test(`at ${viewport.width}x${viewport.height} the landing page reaches past the fork's labels`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.waitForSelector(".line-stage[data-ready]");
    await page.evaluate(() => document.fonts.ready);
    const { end, labels } = await page.evaluate(() => ({
      end: document.documentElement.scrollHeight,
      labels: Math.max(...[...document.querySelectorAll("[data-option]")].map((option) => option.getBoundingClientRect().bottom + scrollY)),
    }));
    expect(end - labels).toBeGreaterThanOrEqual(16);
  });
}

for (const width of [320, 340, 360]) {
  test(`at ${width}px no word in the fork's labels breaks across lines`, async ({ page }) => {
    await page.setViewportSize({ width, height: 640 });
    await page.goto("/");
    await page.waitForSelector(".line-stage[data-ready]");
    await page.evaluate(() => document.fonts.ready);
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll(".line-option-name, .line-option-preview")].flatMap((element) => {
        const text = element.firstChild ?? element;
        const node = text.nodeType === Node.TEXT_NODE ? text : element.querySelector("a")?.firstChild;
        if (!node?.textContent) return [];
        return [...node.textContent.matchAll(/[^\s,]+/g)].flatMap((word) => {
          const range = document.createRange();
          range.setStart(node, word.index);
          range.setEnd(node, word.index + word[0].length);
          const lines = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top)));
          return lines.size > 1 ? [word[0]] : [];
        });
      }),
    );
    expect(broken).toEqual([]);
  });
}

test("on a phone the foot's links and the Markii credit span its width", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto("/professional/career");
  const edges = await page.evaluate(() => {
    const foot = document.querySelector<HTMLElement>(".site-foot")!;
    const right = foot.getBoundingClientRect().right - parseFloat(getComputedStyle(foot).paddingRight);
    const links = [...foot.querySelectorAll(".contact-links a")].at(-1)!.getBoundingClientRect().right;
    const credit = foot.querySelector(".markii-credit")!.getBoundingClientRect().right;
    const repo = foot.querySelector(".markii-credit-repo")!;
    const repoRight = repo.getBoundingClientRect().right + parseFloat(getComputedStyle(repo.parentElement!).paddingRight);
    return { right, links, credit, repoRight };
  });
  expect(Math.abs(edges.links - edges.right)).toBeLessThanOrEqual(1);
  expect(Math.abs(edges.credit - edges.right)).toBeLessThanOrEqual(1);
  expect(Math.abs(edges.repoRight - edges.credit)).toBeLessThanOrEqual(2);
});
