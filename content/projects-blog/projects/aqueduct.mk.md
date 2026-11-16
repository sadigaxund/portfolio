# Aqueduct

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

::::figure{src="https://github.com/user-attachments/assets/92acb8fb-80ad-4cac-b5bd-e00a114d22cb" alt="A failed run producing a pending patch"}
Wake up to a reviewable fix instead of a wall of errors.
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

::::figure{src="https://github.com/user-attachments/assets/29bd3782-ec31-4666-9cb3-3ee8690b38b2" alt="Figure 1: The Healing Flow"}
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

Links: [repository](https://github.com/sadigaxund/aqueduct), [PyPI](https://pypi.org/project/aqueduct-core/), [threat model](https://github.com/sadigaxund/aqueduct/blob/main/docs/threat_model.md), [blueprint and engine spec](https://github.com/sadigaxund/aqueduct/blob/main/docs/specs.md).
