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
