# DESIGN.md

How the site looks. `AGENTS.md` section 13 holds the consistency rules and the refuse list, and this file holds the values they apply to.

## Direction

The site reads as a map seen from above. One line is the only drawing, and the road a visitor has walked turns blue. Everything else is paper, ink, and type.

## Color tokens

Tokens live in `src/styles/tokens.css`. The site follows the visitor's light or dark setting.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-bg` | `#fbfcfd` | `#11151d` | Paper. Every page background. |
| `--color-fg` | `#12151c` | `#eef1f6` | Ink. Text. |
| `--color-primary` | `#12151c` | `#eef1f6` | Ink. The road ahead. |
| `--color-muted` | `#565d6b` | `#9aa3b2` | Dates, previews, and stack lists. |
| `--color-border` | `#cfd5de` | `#2d3543` | Hairlines between regions. |
| `--color-route` | `#1d3fd8` | `#8199ff` | The road walked, threads inside leaves, and keyboard focus. Nothing else. |

## Text roles

Roles live in `src/styles/roles.css`. Pages name a role and never set a size or weight.

| Class | Font | Size | Weight | Use |
|---|---|---|---|---|
| `role-name` | Geologica | 3rem to 4.5rem | 300 | The owner's name, once, on the landing page. |
| `role-heading` | Geologica | 2.5rem to 3.4rem | 300 | The one heading of a page. |
| `role-item` | Geologica | 1.5rem | 400 | A signpost, stop, or entry title. |
| `role-body` | Instrument Sans | 1rem | 400 | Running text, at most 34rem wide. |
| `role-detail` | Instrument Sans | 0.9375rem | 400, muted | Role line, dates, previews, and stack lists. |
| `role-result` | Instrument Sans | inherited | 600 | A measured result inside body text. No other text is bold. |

## Component roles

Each role has one implementation. A variant needs a row here first.

| Role | Implementation | Rule |
|---|---|---|
| Text link | `Link` from `my-you-eye`, or an anchor in `.hero-links`, `.line-option`, `.line-back`, `.stop` | Always underlined. |
| Back link | `.line-back` | Names its destination, as in "Back to Professional". The first control on every page below the root. |
| Hero | `src/discovery/Hero.astro` | Name and role line on the left, summary and contact links on the right. One column on a phone. Appears only on the landing page. |
| Signpost | `.line-option` in `src/line/LineStage.tsx` | Road name in `role-item`, with its children's names in `role-detail`. On a phone three roads share about 108px each, so the name uses the body face at 1rem, weight 500, which keeps "Professional" on one line. |
| Stop | `.stop` in `src/layouts/LineLayout.astro` | Title in `role-item`, then a preview in `role-detail`, at most two lines. A section previews its children's names, and a leaf exports `preview` from its own `meta.ts`. Text hangs directly off its branch, with no card. |
| Timeline entry | `src/ui/Timeline.astro` | Dates in `role-detail`, a route-colored thread with a stop, then title, role line, results, and stack. |
| Step path | Built with the first project leaf | Steps on a route-colored line, each with a short label. A project draws its own idea this way. |

## Leaves

A leaf owns the whole screen, and its layout may differ from other leaves. Type, color tokens, and the Back link never differ.

The contract:

- A leaf is `src/sections/<route>/Leaf.astro`, where `<route>` is the node's URL path. The folder holds everything the leaf needs.
- It receives `node`, and renders inside the surface the layout provides. It adds no `main`, and the layout supplies Back.
- It renders exactly one `h1`, in `role-heading`.
- It imports shared code only, never another section.
- It needs no engine change and no tree change beyond its own node.
- A leaf with no folder gets `src/sections/DefaultLeaf.astro`.

## Motion

The line is the one authored motion. It lives in one world with one camera, and every route between non-leaf nodes is a walk. Timing lives in `src/line/steps.ts` and `src/line/seam.ts`. Everything else stays still.

## Glossary

| Word | Means | Do not write |
|---|---|---|
| Career | Employment history | Work, experience, journey |
| Projects | Things the owner built | Work, portfolio pieces |
| Blog | Articles by the owner | Writing, posts page |
| Certifications | Awards and certificates | Credentials, badges |
| Education | Degrees | Academics, studies |
| Back | The control that returns one level | Return, go up |
| Start | The landing page, as Back names it | Home, top |

## Review

The dev-only `/kit` page renders every built role side by side. Check it after changing any role.
