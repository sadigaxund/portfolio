# Mandible

A terminal manual for every command-line tool on your machine.

```lua {name=repo permissions=api.github.com}
local r = net.fetch_json("https://api.github.com/repos/AS-FOSS/mandible")
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

`man` tells you about one command. `--help` tells you about one invocation. Neither explores a tool you don't already know.

## What it does

Run `mandible docker` and it opens a tree of every command, subcommand and flag, with the selected one's documentation beside it. It runs on Linux and macOS, on x86_64 and arm64.

::::figure{src="https://github.com/user-attachments/assets/bf9e3d32-f8f2-4e33-a82b-a537cea87f55" alt="mandible-0 9 0-demo"}
A tree of every command, subcommand and flag on the left. The selected one's documentation on the right.
::::

## How it works

Mandible asks the tool itself. It reads the tool's `--help`, its shell completion script when one is installed, and its own completion protocol where it has one. There is no per-tool code. Most help text comes from a small set of argument-parsing libraries, so mandible works out which one and reads the text with that library's grammar.

- Rust: clap (v2, v3/v4)
- Go: cobra, urfave/cli, stdlib flag
- Python: argparse, click, docopt
- JavaScript: commander, yargs, oclif
- Java and .NET: picocli, System.CommandLine
- Others: GNU argp and getopt_long, busybox, Symfony Console, OptionParser and Thor, BSD-terse

## Result

It opens any tool, but it does not read every tool correctly yet. A person checks a random sample by hand against each tool's own `--help`.

::::row{cols=2}
:::card
### 27 of 44
Tools fully correct in the latest audit, on 0.9.0 (61%). The true rate is likely between 47% and 74%.
:::

:::card
### 90%
The goal. Accuracy rose from 19% in 0.1.7 to 61% in 0.9.0, on the same tools.
:::
::::

Links: [repository](https://github.com/AS-FOSS/mandible), [crates.io](https://crates.io/crates/mandible), [how the accuracy numbers are made](https://github.com/AS-FOSS/mandible/blob/main/docs/accuracy.md), [design document](https://github.com/AS-FOSS/mandible/blob/main/docs/design.md).
