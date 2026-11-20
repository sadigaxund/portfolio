# git-resume

:::center
![](images/logo-git-resume.webp)
:::

A small release pipeline for a resume written in LaTeX.

```lua {name=repo permissions=api.github.com}
local r = net.fetch_json("https://api.github.com/repos/AS-FOSS/git-resume")
return {
  stars = r.stargazers_count,
  language = r.language,
  pushed_at = r.pushed_at,
  open_issues_count = r.open_issues_count,
}
```

:::row{cols=3}
::stat{data=repo.pushed_at label="Last push" format=relative}
::stat{data=repo.language label="Language"}
::stat{data=repo.stars label="Stars"}
:::

## What it does

You edit a LaTeX file and push. CI compiles it, publishes a `latest-<variant>` release plus dated snapshots, and rebuilds a hosted viewer. Every version you have pushed stays one click away.

```
git push → CI compile → release (latest + dated tags) → live viewer
```

## How it works

::::row{cols=3}
:::card
### Template
Put the resume in `template/` and describe it in `template/resume.yml`. Push to `main`.
:::

:::card
### Variants
One branch, one resume. `main` is the default, and `resume/<role>` is a tailored version for one application. Each branch has its own tags and its own viewer entry.
:::

:::card
### Editing with AI
Point a coding agent such as opencode at the repo and ask it to update the resume.
:::
::::

:::nav_group{title="Links"}
::nav_link[Repository]{href="https://github.com/AS-FOSS/git-resume" desc="github.com/AS-FOSS/git-resume" icon="arrow"}
::nav_link[Live demo]{href="https://as-foss.github.io/git-resume/" desc="as-foss.github.io/git-resume" icon="arrow"}
::nav_link[Demo video]{href="https://www.youtube.com/watch?v=CiZllBuUCZ4" desc="youtube.com" icon="arrow"}
:::

---

::page_back[[Projects](../projects)]

::::row{cols=2}
:::page_prev{img=images/thumb-aqueduct.webp}
[Aqueduct](aqueduct.mk.md)
:::
:::page_next{img=images/thumb-mandible.webp}
[Mandible](mandible.mk.md)
:::
::::
