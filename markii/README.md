# markii

Host settings and packs for the notes in `content/`. This folder is app config that ships with the site, and it is not content.

## settings.json

| Key | Type | Meaning |
|---|---|---|
| `allowedOrigins` | list of strings | The only origins a script may fetch, such as `https://api.github.com`. Any other origin is refused. |
| `runOnOpen` | boolean | When true, a note with scripts runs once as soon as a visitor opens it. When false, scripts run only from the Run button. |

An unknown key or a wrong type fails the build with the key named.

A visitor allows each origin once, from the Run button. A run on open never asks.

## packs

`packs/<namespace>/` holds one prebuilt pack: `pack.json`, `webview.js`, and an optional `webview.css`. The build bundles every folder here. The folder starts empty.
