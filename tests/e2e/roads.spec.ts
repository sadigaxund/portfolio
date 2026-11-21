import { expect, test, type Page } from "@playwright/test";
import { siteRoads } from "./site-nodes.mjs";

const roads = siteRoads();
const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

const colors = (page: Page) =>
  page.evaluate(() => {
    const css = (selector: string, prop: string, pseudo?: string) => {
      const el = document.querySelector(selector);
      return el ? getComputedStyle(el, pseudo).getPropertyValue(prop) : null;
    };
    return {
      tail: css(".line-tail", "background-color"),
      station: css(".stop .stop-branch", "border-bottom-color"),
      badge: css(".line-content .role-heading", "background-color", "::before"),
      paths: [...document.querySelectorAll(".line-fork .line-path")].map((path) => getComputedStyle(path).stroke),
    };
  });

for (const scheme of ["light", "dark"] as const) {
  test.describe(`road colors in ${scheme}`, () => {
    test.use({ colorScheme: scheme });

    for (const road of roads) {
      test(`${road.slug} draws its line, stations, and badge in its own color`, async ({ page }) => {
        await page.goto(`/${road.slug}`);
        await page.waitForSelector(".line-stage[data-ready]");
        const got = await colors(page);
        const want = rgb(road.color[scheme]);
        expect(got.tail).toBe(want);
        expect(got.station).toBe(want);
        expect(got.badge).toBe(want);
      });
    }

    test("the fork shows each road in its own color, and the landing has no badge", async ({ page }) => {
      await page.goto("/");
      await page.waitForSelector(".line-stage[data-ready]");
      const order: Record<string, number> = { left: 0, straight: 1, right: 2 };
      const want = [...roads].sort((a, b) => order[a.side] - order[b.side]).map((road) => rgb(road.color[scheme]));
      expect((await colors(page)).paths).toEqual(want);
      await expect(page.locator(".line-content .role-heading")).toHaveCount(0);
    });
  });
}
