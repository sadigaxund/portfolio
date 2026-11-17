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
| `--color-doc-*` | | | Surfaces and status colors inside markii components. The info, success, warning, and danger hues carry status only, so they do not count as a second accent. |

my-you-eye's own surface, secondary, ring, and status tokens are set from these in `tokens.css`, so library components follow the color scheme. Override a library color only together with its `-fg` pair.

## Text roles

Roles live in `src/styles/roles.css`, and their sizes are `--text-*` tokens in `tokens.css`. Sizes grow from a 360px to a 1920px viewport. The root size stays 16px, so the line's geometry never moves. Pages name a role and never set a size or weight.

| Class | Font | Size, 360 to 1920 | Weight | Use |
|---|---|---|---|---|
| `role-name` | Geologica | 48 to 72px | 300 | The owner's name, once, on the landing page. |
| `role-heading` | Geologica | 40 to 56px | 300 | The one heading of a page. A note's `h1`. |
| `role-item` | Geologica | 24 to 30px | 400 | A signpost, stop, or section title. A note's `h2`. |
| `role-subitem` | Geologica | 19 to 21px | 500 | A title inside a section. A note's `h3`. |
| `role-lead` | Instrument Sans | 19 to 22px | 400 | The one sentence under a page heading: a section's summary, or a note's first paragraph. |
| `role-body` | Instrument Sans | 17 to 19px | 400 | Running text, at most `--measure` wide. |
| `role-detail` | Instrument Sans | 15 to 16px | 400, muted | Role lines, dates, previews, and stack lists. Numbers are tabular. |
| `role-result` | Instrument Sans | inherited | 600 | A measured result inside body text. |

The weights are 300 for display, 400 for text, 500 for small headings, and 600 for results. Nothing is 700, except markii's stat values until markii-org/markii#81 lets the site set them.

`--measure` is `55ch`, which keeps a line of body text between 65 and 75 characters. A note's paragraph written as one emphasis run, such as a role-and-dates line, renders upright in `role-detail`.

## Component roles

Each role has one implementation. A variant needs a row here first.

| Role | Implementation | Rule |
|---|---|---|
| Text link | `Link` from `my-you-eye`, or an anchor in `.hero-links`, `.line-option`, `.line-back`, `.stop` | Always underlined. |
| Back link | `.line-back` | Names its destination, as in "Back to Professional". The first control after the skip link on every page below the root, inside a `nav` landmark. |
| Skip link | `.skip-link` in `src/styles/chrome.css` | "Skip to content", first on every page below the root, shown only while focused. |
| Contact link | `.site-contact` | "Contact", fixed opposite Back on every page below the root, inside the page's `header`. It jumps to the site foot. |
| Site foot | `src/discovery/SiteFoot.astro` | On every page below the root, below a hairline: the owner's name and role in `role-detail`, then the same contact links as the hero. It covers the line, so the line ends where the page does. |
| Contact links | `src/discovery/ContactLinks.astro` | The profile links from `content/profile.yaml`, in the hero and the site foot. Each is at least 44px in both directions. |
| Hero | `src/discovery/Hero.astro` | Name and role line on the left, summary and contact links on the right. One column on a phone. Appears only on the landing page. |
| Signpost | `.line-option` in `src/line/LineStage.tsx` | Road name in `role-item`, with its children's names in `role-detail`. On a phone three roads share about 108px each, so the name uses the body face at 1rem, weight 500, which keeps "Professional" on one line. |
| Stop | `.stop` in `src/ui/SectionBody.astro` | Title in `role-item` with a 44px target, then a preview in `role-detail`, at most 22rem wide and three lines, wrapped without orphans. A section previews its children's names, and a leaf's `preview` comes from `content/site.yaml`, where the build caps it at 90 characters so it is never cut off. A leaf's branch ends in an open ring, and a section's bends on down. Pointing at or focusing a stop draws its branch in the route color, and a leaf's ring fills. Text hangs directly off its branch, with no card. |
| Leaf frame | `.leaf-frame` in `src/styles/leaf.css` | A static route-colored thread down the left. A filled stop marks the title, an open stop marks each `h2`, and the last stop is the leaf foot. Prose keeps the measure, and components use the whole 56rem column. From 72rem wide, `h2` hangs in a 13rem label column left of the thread. On a phone the thread sits where the line rests, 1.5rem from the edge, with a 1.25rem right gutter. |
| Leaf foot | `src/ui/LeafFoot.astro` | "Next: <sibling>" in `role-item`, then Back in `role-detail`. The last leaf of a section shows Back only. |
| Note bar | `src/markii/NoteBar.tsx` | Only on a note with a script fence, at its foot, between hairlines. The age of the values in `role-detail` ("Values as of Nov 2026", "Updated 10 minutes ago"), a secondary 48px "Refresh values" button, and the Markii credit. |
| Grant dialog | `src/markii/GrantDialog.tsx`, from my-you-eye `Dialog` parts | Opens only after Refresh values. A plain title and sentence from the site, then markii's own question quoted unchanged, then markii's two labels at equal size. No danger styling. Closing it any way but Allow answers no. |
| Toast | my-you-eye `Toaster` | One per refresh, on the result only, soft tone. The button's loading state shows that a refresh started. |
| Step path | Built with the first project leaf | Steps on a route-colored line, each with a short label. A project draws its own idea this way. |

## Leaves

Every leaf uses the leaf frame. Type, color tokens, and the Back link never differ.

The contract:

- A leaf is a note at `content/<route>.md` or `content/<route>.mk.md`, where `<route>` is the node's URL path. `src/markii/Note.astro` renders every leaf the same way.
- A note starts with one `h1`. Its elements take the text roles: `h1` is `role-heading`, its first paragraph is `role-lead`, `h2` is `role-item`, `h3` is `role-subitem`, paragraphs and list items are `role-body`, and bold is `role-result`. Code blocks use `CodeBlock` from `my-you-eye`.
- A note with a script fence ends in the note bar. Notes with no script fence ship no markii code, and a note with one loads markii's host only when the visitor refreshes, or on open once this browser has refreshed it before.
- The layout supplies the surface and Back. A note adds no `main`.
- Map text (labels, summaries, previews) lives in `content/site.yaml`.

## Focus and order

On the landing page the hero comes before the roads in the document, so Tab reaches Resume and Email before the fork. After a walk, focus moves to the new page's `h1`, which shows no ring because it is not a control.

## Motion

The line is the one authored motion. It lives in one world with one camera, and every route between non-leaf nodes is a walk. Timing lives in `src/line/steps.ts` and `src/line/seam.ts`. Everything else stays still, including the thread inside a leaf.

## Glossary

| Word | Means | Do not write |
|---|---|---|
| Career | Employment history | Work, experience, journey |
| Projects | Things the owner built | Work, portfolio pieces |
| Blog | Articles by the owner | Writing, posts page |
| Certifications | Awards and certificates | Credentials, badges |
| Education | Degrees | Academics, studies |
| Back | The control that returns one level | Return, go up |
| Values | What a note's scripts produce | Stats, figures, data |
| Contact | The owner's links in the site foot, and the link that jumps there | Get in touch, reach out |
| Refresh values | The control that runs a note's scripts again | Run, update, reload |
| Start | The landing page, as Back names it | Home, top |

## Review

The dev-only `/kit` page renders every built role side by side. Check it after changing any role.
