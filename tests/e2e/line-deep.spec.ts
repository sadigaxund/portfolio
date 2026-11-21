import { expect, test, type Page } from "@playwright/test";

/** Starts a per-frame check that each level's curve starts where the run above it ends. */
const watchSeams = (page: Page) =>
  page.evaluate(() => {
    const win = window as unknown as { seams: { gaps: number[]; levels: number }[] };
    win.seams = [];
    const tick = () => {
      const runs = [document.querySelector(".line-tail")!, ...document.querySelectorAll(".line-levels .line-run")];
      const holders = [...document.querySelectorAll(".line-level-curve")];
      const gaps = holders.map((holder, i) => holder.getBoundingClientRect().top - runs[i].getBoundingClientRect().bottom);
      win.seams.push({ gaps, levels: holders.length });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

const seams = (page: Page) =>
  page.evaluate(() => (window as unknown as { seams: { gaps: number[]; levels: number }[] }).seams);

async function walkAndCheck(page: Page, start: string, act: () => Promise<void>, levelsAfter: number) {
  await page.goto(start);
  await page.waitForSelector('.line-stage[data-settled="true"]');
  await watchSeams(page);
  await act();
  await page.waitForTimeout(300);
  await page.waitForSelector('.line-stage[data-settled="true"]');
  await page.waitForTimeout(100);
  const frames = await seams(page);
  const worst = Math.max(...frames.flatMap((frame) => frame.gaps));
  // A gap means an ancestor's run stops short of the curve that leaves it.
  expect(worst, `largest gap between a run's end and the next curve, over ${frames.length} frames`).toBeLessThanOrEqual(1);
  const last = frames[frames.length - 1];
  expect(last.levels, "levels left on the line").toBe(levelsAfter);
  for (const gap of last.gaps) expect(Math.abs(gap)).toBeLessThanOrEqual(1);
}

test("walking from a section into a child section draws a continuous line", async ({ page }) => {
  await walkAndCheck(page, "/personal", () => page.getByRole("link", { name: /Engineering & Science/ }).first().click(), 1);
});

test("walking back up from a child section leaves a continuous line and nothing of the branch", async ({ page }) => {
  await walkAndCheck(page, "/personal/engineering-science", () => page.locator("[data-back] a").click(), 0);
  await expect(page.locator(".line-levels .line-run")).toHaveCount(0);
});

test("a warm round trip into a child section and back stays continuous", async ({ page }) => {
  await page.goto("/personal");
  await page.waitForSelector('.line-stage[data-settled="true"]');
  await page.getByRole("link", { name: /Engineering & Science/ }).first().click();
  await page.waitForSelector('.line-stage[data-settled="true"]');
  await expect(page).toHaveURL(/engineering-science$/);
  await watchSeams(page);
  await page.locator("[data-back] a").click();
  await expect(page).toHaveURL(/\/personal$/);
  await page.waitForSelector('.line-stage[data-settled="true"]');
  await page.waitForTimeout(100);
  const frames = await seams(page);
  expect(Math.max(...frames.flatMap((frame) => frame.gaps))).toBeLessThanOrEqual(1);
  expect(frames[frames.length - 1].levels).toBe(0);
});
