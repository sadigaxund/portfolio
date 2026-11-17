# markii

Host settings and packs for the notes in `content/`. This folder is app config that ships with the site, and it is not content.

## settings.json

| Key | Type | Meaning |
|---|---|---|
| `allowedOrigins` | list of strings | The only origins a script may fetch, such as `https://api.github.com`. Any other origin is refused. |
| `runOnOpen` | boolean | When true, a note with scripts runs once as soon as a visitor opens it. When false, scripts run only from the Run button. |
| `hideScriptBlocks` | boolean | When true, the collapsed script marker under each script is hidden. A failed value still shows its own marker. |

An unknown key or a wrong type fails the build with the key named.

A visitor allows each origin once, from the Run button. A run on open never asks.

## packs

`packs/<namespace>/` holds one prebuilt pack: `pack.json`, `webview.js`, and an optional `webview.css`. The build bundles every folder here, and evaluates them in Node so a pack component renders in the static HTML.

`nav` 1.0.0, from markii-org/markii-packs release v2026.09.12 (commit 986efe8f37ccb0882d14a2ab2cd95acb55d41aad), the prebuilt files from `nav-1.0.0.mkp`.
