# cv pack

Entries for the Career, Education, and Certifications notes. `cv_entry` puts a square logo tile beside the Markdown inside it. A run of entries is joined by a rail in the accent color below each logo, so the list reads as a timeline.

```
:::cv_entry{logo=images/logo-kdm.webp}
## KDM Force

*Data platform engineer. Remote, Rome. Jun 2022 to Nov 2025.*

- Ran 5–7 Hetzner Cloud VMs for dev and production.
:::
```

The logo is a square image with its tile background baked in. Leave `logo` out and a plain tile shows.

The paragraph right after the heading is the role line, and a paragraph written as one emphasis run, such as `*Stack: ...*`, is a detail line. Both show in the muted color at detail size.

## Build

`npm run build:pack` compiles `src/*.tsx` and `src/cv.css` into `../webview.js` and `../webview.css`. Commit the result, because the site bundles the built files.
