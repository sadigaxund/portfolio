# Aqueduct

:::center
![](images/logo-aqueduct.webp)
:::

An AI harness for data pipelines on Spark or DuckDB: the model proposes a fix, and the harness decides.

```lua {name=repo permissions=api.github.com}
local r = net.fetch_json("https://api.github.com/repos/sadigaxund/Aqueduct")
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

## The problem

A pipeline fails at 3 a.m. over a column rename upstream. Somebody gets paged, scrolls a four-kilobyte stack trace, and hand-writes a one-line fix. Aqueduct turns that night into a pull request waiting for review in the morning.

::::video{src="images/aqueduct-demo.mp4" poster="images/aqueduct-demo.webp" alt="Aqueduct in a terminal: the classify_priority module fails on an unresolved SQL column, and the agent answers with a JSON patch that renames the column."}
Wake up to a reviewable fix instead of a wall of errors. [Watch the demo](https://github.com/user-attachments/assets/92acb8fb-80ad-4cac-b5bd-e00a114d22cb).
::::

## What it does

::::row{cols=2}
:::card
### Declarative
Pipelines are YAML blueprints, with no PySpark boilerplate and no operator classes. One blueprint runs on Spark or DuckDB.
:::

:::card
### Self-healing
On failure, an LLM agent diagnoses the root cause and emits a structured patch. The patch must clear guardrail, lineage, and sandbox gates first.
:::

:::card
### Model-agnostic
Anthropic natively, or any OpenAI-compatible endpoint, including a local model on Ollama or LM Studio.
:::

:::card
### Local-first
Point it at a model inside your perimeter and your data, schemas, and error traces never leave your servers.
:::
::::

## How it works

The model does one thing deterministic code cannot: it turns an unstructured failure into a structured hypothesis. Everything after that is deterministic. The patch grammar has 15 operations and no code generation, so the agent cannot write code, edit files, or run shell commands.

A patch clears four gates and a compile-check before it touches the blueprint. The first failure wins.

```
guardrails → compile-check → lineage → sandbox → resolvability → patch applied
```

::::figure{src="images/aqueduct-healing-flow.webp" alt="Flowchart of the healing flow: a run failure passes through capture, memory, prune, generate, reprompt, gates, and confirm and write. A patch that passes lands in patches/applied; anything else waits in patches/pending for review."}
The healing flow.
::::

Who applies the patch is a setting:

:::::tabs
::::tab{label="human"}
An engineer reviews and applies the patch, or reviews it in a pull request. This is the production default behind CI/CD.
::::
::::tab{label="auto"}
Aqueduct applies the patch in memory, re-validates, and writes only if the re-run succeeds. It needs an explicit `allowed_paths` allowlist.
::::
::::tab{label="disabled"}
The LLM never fires. Healing is off.
::::
:::::

Low-confidence patches and any guardrail violation escalate to human review.

## Where it stands

- Beta, published on PyPI as `aqueduct-core`. It needs Python 3.11 or newer.
- CI tests every release from Spark 3.5 through 4.1.
- Apache 2.0, with no telemetry and no lock-in.

:::nav_group{title="Links"}
::nav_link[Repository]{href="https://github.com/sadigaxund/aqueduct" desc="github.com/sadigaxund/aqueduct" icon="arrow"}
::nav_link[PyPI]{href="https://pypi.org/project/aqueduct-core/" desc="pypi.org/project/aqueduct-core" icon="arrow"}
::nav_link[Threat model]{href="https://github.com/sadigaxund/aqueduct/blob/main/docs/threat_model.md" desc="docs/threat_model.md on GitHub" icon="arrow"}
::nav_link[Blueprint and engine spec]{href="https://github.com/sadigaxund/aqueduct/blob/main/docs/specs.md" desc="docs/specs.md on GitHub" icon="arrow"}
:::

::page_back[[Projects](../projects)]
