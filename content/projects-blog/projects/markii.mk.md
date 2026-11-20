---
title: Format Tour
description: A guided tour of Markii, from directives to layout to scripting.
---

:::center
![](images/logo-markii.webp)
:::

# Welcome to Markii

This page is a Markii document. Each part below shows one feature of the
format, written in that feature.

## Start with what you know

Everything markdown does still works: **bold**, links, lists, tables. Markii
adds one rule on top: a *directive* places a component in the document.

:::callout{type=info title="This box is a directive"}
Write `:::callout` on a line, any markdown inside, and close with `:::`.
The two boxes below change only `type=info` to `warning` and `danger`.
:::

:::callout{type=warning title="Same box, different temper"}
One attribute is the whole difference. Nothing else about the box changes.
:::

:::callout{type=danger title="And the loudest one"}
Colors come from the host's theme, so this stays readable in light and dark.
:::

Small ones fit inside a sentence: press :kbd[Ctrl+Z] if you regret an edit,
and mark things :badge[beta]{variant=info}, :badge[stable]{variant=success},
:badge[slow]{variant=warning}, :badge[broken]{variant=danger}, or leave a
badge :badge[plain] with no variant at all.

## The live part

This document fetches its own data. Rendering never runs code, so the
block below runs only when the site is built, or when you press **Update**
at the top of the page:

```lua {name=repo permissions=api.github.com}
local repo = net.fetch_json("https://api.github.com/repositories/10270250")
return {
  stars = repo.stargazers_count,
  forks = repo.forks_count,
  spark = {3, 5, 4, 8, 7, 10, 12},
}
```

The build ran it once, so facebook/react has :value[repo.stars] stars.

Without a value, that sentence would show a quiet `{repo.stars}` marker,
and every component below an empty state. That is the format's core
promise: a document is always readable, with or without its data.

## A dashboard from one value

The script returned one value with three fields, and dotted paths reach into
it. Rows lay components side by side; a `cell` groups blocks into one cell:

::::row{cols=2}
:::cell
::stat{data=repo.stars label="stars" trend=up}
::progress{data=repo.stars max=250000 label="stars toward 250k"}
:::

:::cell
::stat{data=repo.forks label="forks"}
::chart{data=repo.spark kind=line}
:::
::::

Notice the colons: the outer `::::row` uses four, the `:::cell` fences
inside use three. Bigger fence, bigger box.

## Layout without CSS

Plain markdown can be placed too. Wrap anything in `:::center`,
`:::right`, `:::fit`, `:::narrow`, `:::wide`, or `:::full`:

:::center
| build  | status  |
| ------ | ------- |
| `main` | passing |
:::

That table is centered because of the wrapper, not because of anything in
the table. There is deliberately nothing else to learn here: no style
attributes, no pixel values.

A wrapper sets one of the two layout axes, size or place, and takes the
other as an attribute, so one fence can do both. A table is already sized
to its content, so `:::center` alone places it; a callout fills the column,
so it needs `width=fit` before there is anything to center:

::::center{width=fit}
:::callout{type=info}
Sized to its text, then centered.
:::
::::

Aligning the text inside a component is a different job, and it has its own
attribute named after what moves. `row`, `cell`, `card`, and `callout` take
`text`, and a row hands it to every cell:

:::row{cols=3 text=center}
Centered.

Also centered.

And this one too.
:::

A `card` is the other half of the same idea. It draws a raised surface
around whatever you put in it, and it holds ordinary markdown:

::::row{cols=2}
:::card
### A card
Headings, lists, and `code` all work inside one.
:::

:::card
### Another
Cards in a row share the width evenly, and stack when the page gets narrow.
:::
::::

## More to play with

Tabs hold alternative views of the same spot:

::::tabs
:::tab{label="Why Markii?"}
Notes deserve components without becoming code. A Markii file stays plain
readable markdown in every editor on earth.
:::
:::tab{label="Non-goals"}
No expressions, no conditionals, no loops. A note is not a program, and the
syntax is designed so it never can be.
:::
::::

Details fold long content away. Add the bare `open` attribute to start
one expanded:

:::details{title="Click to expand"}
A collapsible block, closed by default. How is the tour so far, by the way?
::rating{value=5 max=5}
:::

And a figure pairs an image with a markdown caption:

::::figure{src="images/markii-tour-nature.webp"}

**Figure 1.** The caption is markdown, so it can hold *emphasis* or links.
::::

A divider marks a section break without borrowing CommonMark's `---`:

::divider{label="Part 2" variant="dots"}


## Now break something

A misspelled name, such as `callotu` for `callout`, does not crash the page. An
unknown name renders a labeled box with its content intact, which is what
lets a note travel to machines with different components installed:

:::timeline{src="repo.json"}
Nothing here registers `timeline`, so this shows the fallback with the
content preserved. Nothing is lost.
:::

Two smaller mistakes get their own quiet markers rather than silence. An
inline component given attributes but no text has nothing to show, so it
says so on hover:

::badge{label="wrong"}

And a block component written as though it were inline is labeled where it
sits, without disturbing the sentence around it: :stat[oops]{data=nothing}
lands mid-paragraph and the paragraph survives.

Directive syntax inside a code fence stays literal, so examples are safe:

```
:::callout{type=info}
Not rendered, because it is inside a fence.
:::
```

## Where to go next

This page is a tour, not the product. The format and its libraries
live in the [repository](https://github.com/markii-org/markii). The
documentation is written to be read in order, but each page stands on its
own:

| Page | Read it when you want to |
| --- | --- |
| [format.md](https://github.com/markii-org/markii/blob/main/docs/format.md) | Write documents: directives, components, layout, links |
| [scripting.md](https://github.com/markii-org/markii/blob/main/docs/scripting.md) | Add live values with Lua: scripts, freshness, reading your own note |
| [bundles.md](https://github.com/markii-org/markii/blob/main/docs/bundles.md) | Ship a note with its assets and scripts as one `.mkz` file |
| [packs.md](https://github.com/markii-org/markii/blob/main/docs/packs.md) | Build your own components and share them as a pack |
| [security.md](https://github.com/markii-org/markii/blob/main/docs/security.md) | Understand what a script can and cannot do, and why |
| [integration.md](https://github.com/markii-org/markii/blob/main/docs/integration.md) | Embed Markii in your own app: rendering, theming, running scripts |
| [spec.md](https://github.com/markii-org/markii/blob/main/docs/spec.md) | Check the normative rules of the format |

Where to use it and what to use it with:

| Project | What it is |
| --- | --- |
| [VS Code extension](https://marketplace.visualstudio.com/items?itemName=markii.markii-vscode) | Preview, run, complete, and export `.mk.md` files; where packs are developed |
| [Obsidian plugin](https://github.com/markii-org/markii-obsidian) | The same preview, run, and export inside a vault, installed through BRAT |
| [markii-packs](https://github.com/markii-org/markii-packs) | Ready-made component packs: blog, dash, data, fin, prep, read, tech, track |
| [markii-vault](https://github.com/markii-org/markii-vault) | Example notes and a starter vault showing the pieces working together |

---

::page_back[[Projects](../projects)]

::::row{cols=2}
:::page_prev{img=images/thumb-mandible.webp}
[Mandible](mandible.mk.md)
:::
:::page_next{img=images/thumb-aqueduct.webp}
[Aqueduct](aqueduct.mk.md)
:::
::::
