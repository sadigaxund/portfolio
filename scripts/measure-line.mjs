// Lab measurement of the line transition. Usage: node scripts/measure-line.mjs --help
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { root } from "./lib/source.mjs";
import { CURVES, peakJump } from "./lib/ease.mjs";
import { PLANTS } from "./lib/plants.mjs";
import { median, parseTrace } from "./lib/trace.mjs";
import { serve } from "./lib/serve.mjs";
import { VARIANTS, buildWithoutLibrary, builtSize } from "./lib/variants.mjs";

const HELP = `node scripts/measure-line.mjs [options]
  --runs N          transitions per row, default 5
  --variants A,W,B  A baseline, W warm cache, B no library, C no route change, D will-change, E short page
  --cpu 1,4         CPU throttle rates
  --viewports desktop,phone
  --plant NAME      ${Object.keys(PLANTS).join(", ")}: plant a known defect into variant A
  --gpu             use the machine GPU through ANGLE instead of software rendering
  --work DIR        scratch folder for the no-library build, default under the OS temp folder
  --dump FILE       write the raw trace of the last run to FILE
  --ease            only print the per-frame jump table, no browser
Run npm run build first. The no-library variant is built in the scratch folder, never in the repo.`;

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback);

const VIEWPORTS = { desktop: { width: 1280, height: 800 }, phone: { width: 360, height: 740 } };
const MARKS = `
  for (const name of ["line:transition-start", "line:transition-end"]) {
    document.addEventListener(name, () => { performance.mark(name); if (name.endsWith("end")) window.__lineEnded = true; });
  }
`;

function injectCss(css) {
  return `(() => {
    const put = () => {
      if (document.querySelector("style[data-variant]")) return;
      const style = document.createElement("style");
      style.dataset.variant = "";
      style.textContent = ${JSON.stringify(css)};
      document.head.append(style);
    };
    document.addEventListener("DOMContentLoaded", put);
    document.addEventListener("astro:after-swap", put);
  })();`;
}

async function trace(cdp, action) {
  const events = [];
  cdp.on("Tracing.dataCollected", (chunk) => events.push(...chunk.value));
  const done = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve));
  const categories = ["devtools.timeline", "disabled-by-default-devtools.timeline", "cc", "benchmark", "viz", "gpu", "toplevel", "blink.user_timing"];
  await cdp.send("Tracing.start", { traceConfig: { recordMode: "recordAsMuchAsPossible", includedCategories: categories }, transferMode: "ReportEvents" });
  await action();
  await cdp.send("Tracing.end");
  await done;
  cdp.removeAllListeners("Tracing.dataCollected");
  return events;
}

async function oneRun(browser, variant, base, viewport, cpu, plant) {
  const context = await browser.newContext({ viewport });
  try {
    const page = await context.newPage();
    await page.addInitScript(MARKS);
    if (plant) await page.addInitScript(PLANTS[plant].script);
    if (variant.css) await page.addInitScript(injectCss(variant.css));
    await page.goto(`${base}/spike`);
    await page.waitForSelector(".line-stage[data-ready]");
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
    await variant.prepare?.(page);
    await page.waitForTimeout(600);
    const events = await trace(cdp, async () => {
      await variant.trigger(page);
      await page.waitForFunction("window.__lineEnded === true", null, { polling: 100, timeout: plant === "noraf" ? 2500 : 20000 }).catch(() => undefined);
      await page.waitForTimeout(300);
    });
    if (flag("dump")) writeFileSync(option("dump", "trace.json"), JSON.stringify(events));
    return parseTrace(events);
  } finally {
    await context.close();
  }
}

const fixed = (value, digits = 1) => Number(value).toFixed(digits);

function summarize(runs) {
  const good = runs.filter((run) => !run.error);
  const pick = (key) => median(good.map((run) => run[key]));
  const tops = good.map((run) => run.topEvent);
  return {
    runs: good.length,
    ticks: pick("ticks"),
    presented: pick("presented"),
    screen: pick("screenFrames"),
    screenGap: pick("screenWorstGapMs"),
    lost: pick("lost"),
    dropped: pick("dropped"),
    worstGap: pick("worstGapMs"),
    mainMedian: pick("mainMedianMs"),
    mainWorst: pick("mainWorstMs"),
    longestTask: pick("longestTaskMs"),
    paintArea: pick("paintAreaMpxPerFrame"),
    paints: pick("paintEventsPerFrame"),
    nodes: good[0]?.paintedNodes ?? {},
    top: tops.sort((a, b) => tops.filter((x) => x === b).length - tops.filter((x) => x === a).length)[0] ?? "none",
    completed: good.filter((run) => run.completed).length,
    software: good.some((run) => run.softwareCompositor),
  };
}

function printTable(rows) {
  const header = ["variant", "view", "cpu", "runs", "rAF", "line shown", "screen", "lost", "dropped", "gap ms", "screen gap", "main med", "main max", "task max", "paints/f", "bounded Mpx/f", "top event ms/frame"];
  const body = rows.map(({ name, view, cpu, s }) => [
    name, view, `${cpu}x`, s.runs, s.ticks, s.presented, s.screen, s.lost, s.dropped, fixed(s.worstGap), fixed(s.screenGap), fixed(s.mainMedian, 2),
    fixed(s.mainWorst, 2), fixed(s.longestTask), fixed(s.paints, 1), fixed(s.paintArea, 2), s.top,
  ].map(String));
  const widths = header.map((title, i) => Math.max(title.length, ...body.map((row) => row[i].length)));
  const line = (row) => row.map((cell, i) => cell.padEnd(widths[i])).join("  ");
  console.log([line(header), line(widths.map((w) => "-".repeat(w))), ...body.map(line)].join("\n"));
  console.log("\nPaint events per frame by node, first run of each 1x row");
  for (const { name, view, cpu, s } of rows) {
    if (cpu !== 1) continue;
    const nodes = Object.entries(s.nodes).map(([key, count]) => `${key.replace(/ class='([^']*)'/, ".$1")} ${count.toFixed(1)}`);
    console.log(`${name} ${view}: ${nodes.join(", ")}`);
  }
}

async function geometry(browser, base) {
  const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
  const page = await context.newPage();
  await page.addInitScript(`
    document.addEventListener("line:transition-start", (event) => {
      const probe = document.createElement("div");
      probe.style.transform = "translateX(var(--line-rest))";
      document.body.append(probe);
      const rest = new DOMMatrix(getComputedStyle(probe).transform).m41;
      probe.remove();
      window.__geometry = { ...event.detail.measure, rest, chosen: event.detail.chosen };
    });
  `);
  await page.goto(`${base}/spike`);
  await page.waitForSelector(".line-stage[data-ready]");
  await page.getByRole("link", { name: "Projects" }).click();
  await page.waitForFunction("window.__geometry", null, { polling: 100 });
  const found = await page.evaluate("window.__geometry");
  await context.close();
  return found;
}

function printEase(m) {
  const stubEnd = m.forkY + m.stem * 1.5;
  const travel = { "chosen tip": m.height - stubEnd, camera: Math.hypot(m.rest - m.chosen * m.spread, m.lift) };
  console.log(`\nPer-frame jump in px for 0.9 s at 1280x800 (page ${m.height}px tall, tip travel ${travel["chosen tip"].toFixed(0)}px, camera travel ${travel.camera.toFixed(0)}px)`);
  console.log("curve".padEnd(36) + "fps  tip peak  tip first  cam peak  frames to 50%");
  for (const [name, curve] of Object.entries(CURVES)) {
    for (const fps of [60, 120]) {
      const tip = peakJump(curve, 0.9, fps, travel["chosen tip"]);
      const camera = peakJump(curve, 0.9, fps, travel.camera);
      console.log(`${name.padEnd(36)}${String(fps).padEnd(5)}${fixed(tip.peak, 0).padStart(8)}${fixed(tip.first, 0).padStart(11)}${fixed(camera.peak, 0).padStart(10)}${String(tip.halfAt).padStart(14)}`);
    }
  }
}

async function main() {
  if (flag("help")) return console.log(HELP);
  const runs = Number(option("runs", 5));
  const plant = option("plant", null);
  const names = plant ? ["A"] : option("variants", "A,W,B,C,D,E").split(",");
  const rates = option("cpu", "1,4").split(",").map(Number);
  const views = option("viewports", "desktop,phone").split(",");
  const work = option("work", mkdtempSync(join(tmpdir(), "measure-line-")));
  const dists = { dist: join(root, "dist") };
  builtSize(dists.dist);
  if (names.some((name) => VARIANTS[name].build === "nolib")) {
    const built = buildWithoutLibrary(work);
    dists.nolib = built.dist;
    console.log(`no-library build ok, ${built.bytes} bytes of assets against ${builtSize(dists.dist)} in the real build`);
  }
  const servers = await Promise.all(Object.entries(dists).map(async ([key, dir], i) => [key, await serve(dir, 4390 + i)]));
  const bases = Object.fromEntries(servers.map(([key, server]) => [key, server.url]));
  const gpu = ["--use-gl=angle", "--use-angle=gl-egl", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"];
  const browser = await chromium.launch(flag("gpu") ? { channel: "chromium", ignoreDefaultArgs: ["--disable-gpu"], args: gpu } : { channel: "chromium" });
  try {
    const probe = await browser.newPage();
    await probe.goto("about:blank");
    const renderer = await probe.evaluate(`(() => {
      const gl = document.createElement("canvas").getContext("webgl");
      const info = gl?.getExtension("WEBGL_debug_renderer_info");
      return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "unknown";
    })()`);
    console.log(`browser Chromium ${browser.version()} (new headless), renderer ${renderer}, ${runs} runs per row${plant ? `, plant ${plant}: ${PLANTS[plant].note}` : ""}`);
    await probe.close();
    const m = await geometry(browser, bases.dist);
    const rows = [];
    for (const name of names) {
      const variant = VARIANTS[name];
      for (const view of views) {
        for (const cpu of rates) {
          const results = [];
          for (let i = 0; i < runs; i += 1) results.push(await oneRun(browser, variant, bases[variant.build], VIEWPORTS[view], cpu, plant));
          const errors = results.filter((run) => run.error);
          if (errors.length > 0) console.log(`${variant.label} ${view} ${cpu}x: ${errors.length} run(s) failed: ${errors[0].error}`);
          rows.push({ name: variant.label, view, cpu, s: summarize(results) });
        }
      }
    }
    printTable(rows);
    console.log(`\nCompositor: ${rows.every((row) => row.s.software) ? "software (SoftwareRenderer in every trace)" : rows.some((row) => row.s.software) ? "mixed" : "GPU (no SoftwareRenderer events)"}`);
    printEase(m);
  } finally {
    await browser.close();
    servers.forEach(([, server]) => server.close());
  }
}

if (flag("ease")) {
  const browser = await chromium.launch({ channel: "chromium" });
  const server = await serve(join(root, "dist"), 4390);
  printEase(await geometry(browser, server.url));
  await browser.close();
  server.close();
} else {
  await main();
}
