# page pack

The links at the end of a leaf note. `page_back` is one quiet line back to the parent. `page_prev` and `page_next` are cards for the neighbouring pages, and the whole card is the link. The pack stays local until markii-org/markii-packs#4 ships one.

```
::page_back[Projects](../projects)
::::row{cols=2}
:::page_prev{img=images/thumb-git-resume.webp}
[git-resume](git-resume.mk.md)
:::
:::page_next{img=images/thumb-markii.webp}
[Markii](markii.mk.md)
:::
::::
```

The pack is named `page` so the directives read `page_back`, `page_prev`, and `page_next`. Markii requires the folder to match the pack name.

## Build

`npm run build:pack` compiles `src/*.tsx` and `src/pager.css` into `../webview.js` and `../webview.css` with `@markii/pack-build`. Commit the result, because the site bundles the built files.
