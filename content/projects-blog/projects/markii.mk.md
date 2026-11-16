# Markii

Markdown that renders your own components, for notes that need callouts, tabs, charts, or live data. This page is a Markii document rendered by this site.

```lua {name=demo}
local series, total = {}, 0
for i = 1, 8 do
  series[i] = i * i
  total = total + series[i]
end
return { series = series, total = total }
```

::chart{data=demo.series kind=line}

The squares of 1 to 8, computed in your browser by a Lua script in this page, sum to :value[demo.total].

## What it does

A `.mk.md` file is plain CommonMark plus one small directive syntax. It opens as readable markdown in any editor, and as a living document in anything that speaks Markii. Delete every directive and script and a coherent note remains.

:::::tabs
::::tab{label="Source"}
```
:::callout{type=warning title="Heads up"}
This ships **Tuesday**.
:::
```
::::
::::tab{label="Rendered"}
:::callout{type=warning title="Heads up"}
This ships **Tuesday**.
:::
::::
:::::

## How it works

::::row{cols=3}
:::card
### Directives
They carry no expressions, conditionals, or loops. An unknown component renders as a labeled box, and nothing in a note can break the page.
:::

:::card
### Scripts
Scripting lives in a separate sandboxed Lua layer that most files never touch. Scripts feed components with data that can refresh.
:::

:::card
### Packs
Packs are the unit for sharing components. Static HTML or PDF is an export.
:::
::::

## Where it runs

- A playground in the browser.
- A VS Code extension and an Obsidian plugin.
- A command line that views, exports, and runs a note, plus a language server for Helix, Emacs, and Neovim.
- `@markii/react` for a React app, `@markii/html` for static HTML, and `@markii/ansi` for the terminal.

Links: [repository](https://github.com/markii-org/markii), [playground](https://markii-org.github.io/markii-vault/), [documentation](https://github.com/markii-org/markii/blob/main/docs/README.md), [demo video](https://github.com/user-attachments/assets/a806b239-8d73-4735-a1f5-53e22a76adf3).
