import { expect, test, type Page } from "@playwright/test";

type Colors = { background: string; border: string; text: string };

async function openWatched(page: Page, path: string) {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (req) => problems.push(`failed: ${req.url()}`));
  page.on("response", (res) => {
    if (res.status() >= 400) problems.push(`${res.status()}: ${res.url()}`);
  });
  await page.goto(path);
  await page.getByRole("button", { name: "PLACEHOLDER" }).waitFor();
  return problems;
}

function colorsOf(page: Page): Promise<Colors> {
  return page.getByRole("button", { name: "PLACEHOLDER" }).evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      background: style.backgroundColor,
      border: style.borderTopColor,
      text: style.color,
    };
  });
}

function primaryToken(page: Page): Promise<string> {
  return page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = "var(--color-primary)";
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  });
}

test("loads without console errors or failed requests", async ({ page }) => {
  const problems = await openWatched(page, "/smoke");
  await page.waitForLoadState("networkidle");
  expect(problems).toEqual([]);
});

test("button is visible and styled by the library", async ({ page }) => {
  await openWatched(page, "/smoke");
  const button = page.getByRole("button", { name: "PLACEHOLDER" });
  await expect(button).toBeVisible();
  const colors = await colorsOf(page);
  const token = await primaryToken(page);
  expect(token).not.toBe("rgba(0, 0, 0, 0)");
  expect(colors.background).toBe(token);
});

test("button colors differ between light and dark", async ({ page }) => {
  await openWatched(page, "/smoke");
  const light = await colorsOf(page);
  await openWatched(page, "/smoke?theme=dark");
  await expect(page.locator("html")).toHaveClass(/dark/);
  const dark = await colorsOf(page);
  expect(dark).not.toEqual(light);
});

test("keyboard focus shows a focus style", async ({ page }) => {
  await openWatched(page, "/smoke");
  const button = page.getByRole("button", { name: "PLACEHOLDER" });
  const read = () =>
    button.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.boxShadow;
    });
  expect(await read()).toBe("none");
  await page.keyboard.press("Tab");
  await expect(button).toBeFocused();
  expect(await read()).not.toBe("none");
});

test("the landing hero answers first, and stays clear of the line in every look", async ({ page }) => {
  for (const comp of ["", "ink", "paper", "night"]) {
    await page.goto(comp ? `/?comp=${comp}` : "/");
    await page.waitForSelector(".line-stage[data-ready]");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const label of ["Email", "GitHub", "LinkedIn"]) {
      await expect(page.getByRole("link", { name: label })).toBeInViewport();
    }
    const clash = await page.evaluate(() => {
      const hero = document.querySelector(".hero")!.getBoundingClientRect();
      const trunk = document.querySelector(".line-trunk")!.getBoundingClientRect();
      const texts = [...document.querySelectorAll(".hero h1, .hero p, .hero li")].map((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return range.getBoundingClientRect();
      });
      return {
        crosses: texts.some((box) => box.left < trunk.right && box.right > trunk.left && box.top < trunk.bottom && box.bottom > trunk.top),
        offscreen: hero.left < 0 || hero.right > document.documentElement.clientWidth,
      };
    });
    expect(clash, comp).toEqual({ crosses: false, offscreen: false });
  }
});
