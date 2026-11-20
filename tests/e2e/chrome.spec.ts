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
  expect(await tabOrder(page, 2)).toEqual(["Skip to content", "Back to Start"]);
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
  await expect(page.getByRole("navigation", { name: "Back" }).getByRole("link")).toHaveText("Back to Start");
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
