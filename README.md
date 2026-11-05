# Portfolio

Personal portfolio site. Astro static output, React islands, Tailwind v4, and the `my-you-eye` component library.

## Install

Requires Node 22.

```bash
npm ci
npx playwright install chromium
```

## Develop

```bash
npm run dev
```

## Validate

```bash
npm run validate   # types, lint, shape guard, design guard, build
npm run test:e2e   # Playwright against the built site
```

Run `npm run validate` before `npm run test:e2e`. The tests serve the output in `dist/`.

## Measure the line transition

Open `/spike?debug=line` in a browser. A small overlay shows the last transition: duration, rAF frames, average fps, estimated refresh rate, dropped frames, frame gaps, per-frame jump in px, long animation frames, view transition time, device pixel ratio, browser, and renderer. The flag stays on for the session through `sessionStorage`. The overlay also prints one JSON line to the console, and the Copy button puts it on the clipboard. Without the flag the debug code is never downloaded. Firefox reports the APIs it lacks as `unsupported`.

For a repeatable lab run, build first, then run `node scripts/measure-line.mjs`. It drives Playwright Chromium with CDP tracing, compares the variants listed under `--help` (baseline, no library, no route change, `will-change`, short page), at 1x and 4x CPU throttle and at two viewports, and prints one table. The `--plant` option plants a known defect to show the instrument can see it. Headless Chromium renders in software by default, so use `--gpu` for the machine GPU.
