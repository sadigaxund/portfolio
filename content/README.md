# Content

Everything the owner edits by hand lives here. A push to `main` redeploys the site.

## Files

- `site.yaml` is the map of the site. It is one tree from the root: a `label`, then `children` at every level. Comments in the file explain each field.
- `profile.yaml` is the landing page hero: role, summary, and links.
- One note per leaf, at `content/<url path>.md` or `content/<url path>.mk.md`. The note is found by its path, and no field declares it. `professional/career.mk.md` belongs to `/professional/career`. Use `.mk.md` for a Markii note and `.md` otherwise. Each note starts with `# <label>`.

## Nodes

Each node has a `slug` and a `label`. It may have a `summary` (sections only), a `preview` (leaves only), and `children`. A node with children is a section. A node without children is a leaf. Children nest without limit.

`draft: true` marks a node with placeholder content. A build with `SITE_DRAFTS=hide` leaves out the node, its subtree, and any section left empty. Without that variable, drafts show.

`side` appears only on the root's children, and its value is `left`, `straight`, or `right`. There is exactly one road per side until the line engine can draw more.

## Add a leaf

1. Add the node to `site.yaml` under its parent, in the position it should show.
2. Add its note at the matching path.

A section has no note.

## What the build rejects

- A field that is missing, misspelled, or the wrong type in `site.yaml` or `profile.yaml`. The error names the field path.
- A slug that is not lowercase letters, digits, and hyphens, or that repeats among siblings.
- A `summary` on a leaf, a `preview` on a section, or an empty `children` list.
- A `preview` over 90 characters. Three lines on a phone hold 90, so the map never cuts one off.
- A `side` that is missing on a root child, not one of `left`, `straight`, or `right`, or present below the root's children.
- Zero or more than one road for any side.
- A leaf with no note.
- A note with no leaf, including a note for a section.
- Two notes for one leaf, such as both `career.md` and `career.mk.md`.

## Images and links

- Put an image in an `images/` folder beside its note and name it relative to the note, as in `::::figure{src="images/mandible-demo.webp" alt="..."}`. The build copies and fingerprints it.
- Prefer a still WebP over an animated GIF, and link the GIF from the caption as "Watch the demo".
- Write a note's outside links as one `nav_group` from the bundled `nav` pack, one `nav_link` per destination, with the address as `desc`. The git-resume note shows the form.

## YAML tip

A value that contains a colon followed by a space breaks the file. Wrap such a value in double quotes: `preview: "Rust: a TUI manual"`. The build names the line when this happens.
