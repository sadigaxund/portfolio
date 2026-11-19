# page pack

The links at the end of a leaf note. `page_back` is one quiet line back to the parent. `page_next` is a card for the next page, and the whole card is the link. The pack stays local until markii-org/markii-packs#4 ships one.

```
::page_back[Projects](../projects)
:::page_next{img=images/thumb-markii.webp}
[Markii](markii.mk.md)
One preview line.
:::
```

The pack is named `page` so the directives read `page_back` and `page_next`. Markii requires the folder to match the pack name.

## Build

`npm run build:pack` compiles `src/*.tsx` and `src/pager.css` into `../webview.js` and `../webview.css` with `@markii/pack-build`. Commit the result, because the site bundles the built files.
