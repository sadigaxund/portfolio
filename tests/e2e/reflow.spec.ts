import { expect, test, type Page } from "@playwright/test";

// A 320px window and a text-size setting of 200%, which sets html's font size. See DESIGN.md, "Reflow".
const ROUTES = ["/", "/professional", "/projects-blog/projects", "/professional/career", "/projects-blog/projects/mandible"];
const SIZES = [
  { name: "320px", width: 320, height: 640, text: 100 },
  { name: "text 200% at 320px", width: 320, height: 640, text: 200 },
  { name: "text 200% at 360px", width: 360, height: 780, text: 200 },
  { name: "text 200% at 1280px", width: 1280, height: 800, text: 200 },
];

async function open(page: Page, route: string, text: number) {
  await page.addInitScript((percent) => {
    document.addEventListener("DOMContentLoaded", () => {
      document.documentElement.style.fontSize = `${percent}%`;
    });
  }, text);
  await page.goto(route);
  await page.waitForSelector('.line-stage[data-settled="true"]');
}

for (const size of SIZES) {
  test.describe(size.name, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    for (const route of ROUTES) {
      test(`${route} has no horizontal scroll`, async ({ page }) => {
        await open(page, route, size.text);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(over).toBe(0);
      });
    }

    test("the landing trunk starts below the hero", async ({ page }) => {
      await open(page, "/", size.text);
      const gap = await page.evaluate(() => {
        const hero = document.querySelector(".hero")!.getBoundingClientRect();
        const trunk = document.querySelector(".line-trunk")!.getBoundingClientRect();
        return trunk.top - hero.bottom;
      });
      expect(gap).toBeGreaterThan(0);
    });

    for (const route of ["/professional", "/projects-blog/projects"]) {
      test(`${route} heading ends above the first stop`, async ({ page }) => {
        await open(page, route, size.text);
        const gap = await page.evaluate(() => {
          const head = document.querySelector(".line-content")!.getBoundingClientRect();
          const stop = document.querySelector(".stop")!.getBoundingClientRect();
          const text = document.querySelector(".line-content > :last-child")!.getBoundingClientRect();
          return { head: stop.top - head.bottom, text: stop.top - text.bottom };
        });
        expect(gap.head).toBeGreaterThanOrEqual(0);
        expect(gap.text).toBeGreaterThan(0);
      });
    }
  });
}
