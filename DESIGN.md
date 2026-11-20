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

Roles live in `src/styles/roles.css`, and their sizes are `--text-*` tokens in `tokens.css`. Sizes grow from a 360px to a 1920px viewport. The site never sets the root font size, because the line's geometry is in rem and a fluid root would rescale it. A visitor's own font setting still scales the root, and the line reflows with it. Pages name a role and never set a size or weight.

| Class | Font | Size, 360 to 1920 | Weight | Use |
|---|---|---|---|---|
| `role-name` | Geologica | 48 to 72px | 300 | The owner's name, once, on the landing page. |
| `role-heading` | Geologica | 40 to 56px | 300 | The one heading of a page. A note's `h1`. |
| `role-item` | Geologica | 24 to 30px | 400 | A signpost, stop, or section title. A note's `h2`. |
| `role-subitem` | Geologica | 19 to 21px | 500 | A title inside a section. A note's `h3`. |
| `role-lead` | Instrument Sans | 19 to 22px | 400 | The one sentence under a page heading: a section's summary, or a note's first paragraph. |
| `role-body` | Instrument Sans | 17 to 19px | 400 | Running text outside notes, at most `--measure` wide. A note's text fills the leaf column. |
| `role-detail` | Instrument Sans | 15 to 16px | 400, muted | Role lines, dates, previews, and stack lists. Numbers are tabular. |
| `role-result` | Instrument Sans | inherited | 600 | A measured result inside body text. |

The weights are 300 for display, 400 for text, 500 for small headings, and 600 for results. Nothing is 700, except markii's stat values until markii-org/markii#81 lets the site set them.

`--measure` is `55ch`, which keeps a line of body text between 65 and 75 characters. A note's paragraph written as one emphasis run, such as a role-and-dates line, renders upright in `role-detail`.

## Component roles

Each role has one implementation. A variant needs a row here first.

| Role | Implementation | Rule |
|---|---|---|
| Text link | `Link` from `my-you-eye`, or an anchor in `.hero-links`, `.line-option`, `.line-back`, `.stop` | Always underlined. On hover the underline thickens to `--link-hover-thickness` (2px) and the color stays. A box link has no underline. |
| Back link | `.line-back` | A left arrow in the muted color, then the destination's name as the link, as in "Professional" or "Home". "Back to" stays in the link as hidden text, so a screen reader says "Back to Professional". Page names are capitalized. The first control after the skip link on every page below the root, inside a `nav` landmark. Fixed at the top left on sections; on a leaf it sits in the leaf header and scrolls away with it. |
| Skip link | `.skip-link` in `src/styles/chrome.css` | "Skip to content", first on every page below the root, shown only while focused. |
| Site foot | `src/discovery/SiteFoot.astro` | The one foot of every leaf, a full-width band in `--color-doc-surface` below a hairline: the owner's name and role in `role-detail` with the contact links on the left, the Markii credit on the right. Its left edge lines up with Back's text and its right edge with Update. On a short note it sits at the bottom of the window. Stacked on a phone. |
| Contact links | `src/discovery/ContactLinks.astro` | The profile links from `content/profile.yaml`, in the hero and the site foot. Each is at least 44px in both directions. |
| Hero | `src/discovery/Hero.astro` | Name and role line on the left, summary and contact links on the right. One column on a phone. Appears only on the landing page. |
| Signpost | `.line-option` in `src/line/LineStage.tsx` | Road name in `role-item`, with its children's names in `role-detail`. On a phone three roads share about 108px each, so the name uses the body face at 1rem, weight 500, which keeps "Professional" on one line. Below 360px a road is about 96px wide, so the name drops to 0.9375rem, the preview to 0.875rem, and both lose their side padding, which keeps "Certifications" whole. |
| Stop | `.stop` in `src/ui/SectionBody.astro` | Title in `role-item` with a 44px target, then a preview in `role-detail`, at most 22rem wide and three lines, wrapped without orphans. A section previews its children's names, and a leaf's `preview` comes from `content/site.yaml`, where the build caps it at 90 characters so it is never cut off. A leaf's branch ends in an open ring, and a section's bends on down and ends in a filled dot the size of that ring. Pointing at or focusing a stop draws its branch in the route color, and a leaf's ring fills and a section's dot changes color. Text hangs directly off its branch, with no card. The title link stretches over the whole stop, so the branch and the preview open it, and keyboard focus outlines the text area in the route color. A leaf with a `thumb` in `content/site.yaml` shows a 16:10 still above its title, as wide as the preview text below it, with a hairline border and the control radius, aligned to the text's side. It has an empty `alt` because the title beside it names the project, and it sits inside the stretched link. |
| Leaf frame | `src/ui/LeafBody.astro`, `src/styles/leaf.css` | A static, full-width header bar 4rem tall with a hairline below: Back on the left, centered in the bar, and the note bar on the right for a note with scripts. Back and the update controls share one row while they fit. When they would touch, as on a 320px phone or after an update with a long age, the controls move to a second row at its right end. `src/markii/headFit.ts` decides. Then the note in one centered 44rem column, where prose and components share both edges, then the site foot. Back's text on the left, and Update and the site foot on the right, share one side edge. A leaf has no line, so on a phone it drops the map's wide left gutter: the note column, Back's text, Update, and the foot all keep the same 1.25rem edge on both sides. |
| Pager | `markii/packs/page/`, local markii pack, written by hand at the end of each note | A thematic break, then `::page_back[[Projects](../projects)]`: one quiet line with a left arrow and the parent's name as the link, the same form as the Back link. "Back to" is hidden text for screen readers. Below it a two-column `row` holds `:::page_prev` and `:::page_next`, for a parent with three or more children. The list wraps, so the first page's Previous is the last page and the last page's Next is the first. A card narrower than 34rem puts the still on top at 16:10 with a 1px border below it, then the text. Previous has a left chevron before the page name and left-aligned text. Next has a right chevron after the name and right-aligned text. The words "Previous" and "Next" are hidden text for screen readers. A parent with two children has one wide `page_next` card instead: the still on the left half, the name and the preview line on the right. A parent with one child has the Back line only. The whole card is the link through one stretched anchor. Hover and focus turn the border to the accent, and focus adds a 2px outline. The pack uses only `--mk-*` tokens, and it stays local until markii-org/markii-packs#4 ships a pager. |
| Note bar | `src/markii/NoteBar.tsx` | Only on a note with a script fence, at the right end of the leaf header. The data's age in `role-detail` ("Updated Nov 2026", "Updated 10 minutes ago"; a phone drops "Updated") and a secondary 40px "Update" button, whose touch target is 44px. |
| Markii credit | `src/discovery/MarkiiCredit.astro` | In the site foot, one bordered link to markii-org/markii: the Markii logo at 48px, "Powered by" over "Markii", a divider, then the GitHub mark and "GitHub". The border turns route color on hover. |
| Grant dialog | `src/markii/GrantDialog.tsx`, from my-you-eye `ConfirmDialog` | Opens only after Update. The title is "Update from <host>?", the body is markii's own sentence, and the buttons are markii's two labels. No danger styling. Closing it any way but Allow answers no. |
| Toast | my-you-eye `Toaster` | One per update, on the result only, default solid tone, bottom right (bottom center on a phone), one at a time for 5 seconds. An update that gets an error status reports "Could not update" and keeps the shown values. The button's loading state shows that an update started. |
| Print | `src/styles/print.css` | A leaf prints as black text on white with no backgrounds. The line, skip link, header bar, note bar, Markii credit, and toasts are hidden. The site foot keeps the owner's name, role, and contact links. An outside link prints its address after the text, except a nav link, which already shows it. |
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

## Reflow

The site fits a 320px window and html text at 200% with no sideways scroll or overlap. The engine measures the hero's bottom edge and the first stop, and stop rows grow to the tallest stop, so no spacing is a fixed height. `tests/e2e/reflow.spec.ts` checks it. Phone gutters stop growing with text, and a leaf's update controls sit on a second row below Back.

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
| Contact | The owner's links in the hero and the site foot | Get in touch, reach out |
| Update | The control that runs a note's scripts again | Refresh, run, reload |
| Home | The landing page, as Back names it | Start, top |

## Paper

A dot grid is the map's paper. It sits behind the line on every page, in light and dark, and moves with the camera. The rule and pitch live in `src/styles/paper.css`.

## Review

The dev-only `/kit` page renders every built role side by side. Check it after changing any role.
