# AGENTS.md: working agreements for AI agents in this repo

Read this before touching code. Read `PLAN.md` next.

**Precedence:** `PLAN.md` says what to build, why, and how far along it is. `DESIGN.md` says how it looks. This file says how to work here. If they disagree about design, the design file or plan wins and you fix this file. A rule a script can check belongs in that script, and this file then only points to it.

`PLAN.md` is private and gitignored, so a clone does not contain it. It exists only in the maintainer's main checkout.

---

## 1. The invariants that define the project

> **The tree is data.** One typed file defines every node of the site: its parent, label, direction, and URL. The line engine reads that file and contains no node-specific logic. No `if (id === "personal")` in the engine, ever.

Failure it prevents: each new leaf patches the engine, and the core transition breaks a little more with every section. Custom behavior for a topic lives inside that leaf's own folder, behind the leaf contract.

> **Every node is a real page.** Each node has its own URL and a real anchor. A visitor with no animation, a keyboard, or a screen reader reaches the same content.

Failure it prevents: the site becomes a demo that search engines cannot index, links cannot point into, and the back button breaks.

> **Each section stands alone.** Blog, projects, career, certifications, education, and personal each own a folder. A section imports shared code and never imports another section.

Failure it prevents: six small projects turn into one tangled project.

---

## 2. PLAN.md is the memory of this project

- Record every decision in the `PLAN.md` decision log in the same turn it is made. That covers decisions from the user, proposals the user accepted, and reversals.
- A proposal the user has not accepted goes in the proposals table. Do not build on it as if it were settled.
- Update task checkboxes as work finishes. A task is checked only after section 5 passes.
- Record open questions in `PLAN.md`, then ask them.
- A reversal adds a new entry and marks the old one superseded. Never rewrite an old entry.
- After a context compaction, reread `PLAN.md` and this file. Anything you remember that is absent from those files and the repo is not evidence.
- Never cite `PLAN.md` or its ids in tracked files other than this one. Readers of the repo cannot see it, so such a reference is a dead link. Put the reason itself in the tracked text.
- A worktree does not contain `PLAN.md`. A brief for a worktree agent gives its absolute path, or copies the relevant part.

Failure it prevents: a decision made in chat dies with the session, and the next session argues it again.

---

## 3. Delegation

Design stays with the main session. Grunt work goes to the cheaper Sonnet model.

| Main session keeps | Sonnet subagent does |
|---|---|
| Design, UX, and UI decisions | Scaffolding and configuration |
| Motion feel and visual review | Long debugging and reproduction jobs |
| Architecture and the tree model | Porting supplied content into pages |
| Decision log and user questions | Lint, type, and test cleanup |
| Verifying every delegated result | Repetitive edits across many files |

Delegation rules:

- Write the brief with the goal, exact files, constraints, and a checkable definition of done. A subagent starts cold, so link `AGENTS.md` and the `PLAN.md` task id.
- Tell the subagent to stop and report any design choice instead of making it.
- Confirm the model that served the agent by reading `message.model` in its transcript. The `model` parameter of the Agent tool was silently ignored on this machine.
- Verify the work yourself before accepting it. Read the diff, run the gates, and open the result in a real browser. A subagent's own report of success is a claim.
- Run agents that build or test one at a time. Parallel runs exhausted this machine's memory. Read-only searches may run in parallel.
- Give parallel writing agents one `git worktree` each, created before they start. Two agents sharing one checkout once overwrote each other's files.
- Skip delegation when a single command costs less than briefing a cold agent.

---

## 4. UI library policy

`my-you-eye` (npm, source at `github.com/sadigaxund/my-you-eye`) is the first place to look. It is never a limit. Design, feel, and practical code come first.

Follow this order for each UI element:

1. Check `components.json` in the installed package. It is the source of truth for props and variants. Use the library's `SKILL.md` and `references/` for detail.
2. If it exists, import it. Use `className` for layout only, and restyle through theme tokens.
3. If it nearly fits, or is missing, and the need is generic, open an upstream issue or pull request. Build a local version behind the same API in the meantime, so a later swap is one import.
4. If a third-party library does the job better, use it and log the reason in `PLAN.md`.
5. Bespoke work with no reuse value, such as the line engine and leaf scenes, stays local.

Upstream rules:

- One issue per item, titled `[portfolio] Component: the problem`. Prefix matches the repo's existing `[vsnote]` issues.
- A pull request there follows that repo's `AGENTS.md`, including `npm run validate`.
- Track every upstream item in the `PLAN.md` upstream ledger, and delete the local version once a release ships the fix.
- When you take something from a third-party library or build it locally, and it would also fit `my-you-eye`, add a ledger row and open an issue. Include the need, the code or source used here, and a short API sketch. Keep it brief.

Rules adopted from that library, because each one prevented a reported bug:

- Never copy a library component's JSX into this repo. A fork stops receiving fixes.
- Never hardcode a design value in app code. Colors, radii, type sizes, durations, and easings come from tokens. A missing token is added first.
- Every text slot survives a 220-character unbroken string and a 200-character sentence.
- Every flex child holding text gets `min-w-0`.
- Every collection renders a deliberate zero state.
- Never put `backdrop-filter` inside a transforming subtree, and never use `background-attachment: fixed`. Both force a repaint per frame.

---

## 5. Definition of done

Run the gates listed in `package.json` under `validate`. Red means not done.

Green gates do not mean it works. Mandible shipped a completely dead tier through a green suite. Before claiming a UI change works, open it in a real browser and check:

- Desktop width and a 360px phone width
- Keyboard only, with visible focus
- `prefers-reduced-motion: reduce`
- A direct load of the deep link, plus browser back and forward
- For motion, a real run at normal speed with no dropped frames you can see

"I could not verify X" is a useful result. A false "works" costs a session.

A guard is not finished until you have watched it fail. Plant the defect and confirm the run goes red naming what you planted.

Never weaken a lint rule, gate, or config to get green. If a rule looks wrong, stop and report it.

---

## 6. Code limits and the comment contract

| Limit | Number | Source |
|---|---|---|
| Lines in a source file | 250 | Split inside the same folder |
| Lines in a function | 150 | Mandible |
| Lines in one comment block | 12 | Mandible |
| Comment lines over code lines in a file | 0.5 | Mandible |

`scripts/shape-guard.mjs` holds these numbers. Changing one is a decision and goes in the decision log.

A comment at a call site says two things at most: the rule in at most three lines, and the file, demo, or `DESIGN.md` section that shows it. No history, no reasoning chain, no inventory.

---

## 7. Content and personal data

- Never invent a fact about the user. No made-up employers, dates, metrics, or quotes.
- Mark filler with the literal word `PLACEHOLDER`, so a launch check can find every instance.
- Ask the user for facts section by section, and accept a resume or similar document as the answer.
- Keep raw inputs in the gitignored `private/` folder. Copy only what the user approved into tracked content.
- Phone numbers, home addresses, and similar details are published only on explicit request.

---

## 8. Commits and pull requests

- Public prose describes the change, never the conversation. A commit subject plus at most three lines.
- Never paste private instructions, transcribe a discussion, or dump plan text. Link the section instead.
- No personal details beyond the git author. No absolute path from your own machine.
- Never attach a session URL anywhere on GitHub. Add no AI attribution either: no `Co-Authored-By`, no session trailer, no tool metadata. The user's own rule here is stricter than mandible's habit.
- Commit per unit of work, never per session. Commit before you attack your own work.
- Stage files by name, never `git add -A`.
- If an artifact leaks into history, notify the user and wait. Never force-overwrite published history.
- One branch and one pull request per bundle of tasks. A prose-only diff goes direct to `main`.
- Never address other people on GitHub without the user's explicit consent. The account speaks in the user's voice.

Who may do what:

| Action | Worker subagent | Orchestrator (main session) |
|---|---|---|
| `git add`, `git commit` | Yes | Yes |
| `git push`, for example to trigger CI | No | Yes |
| Tag, release, merge a pull request | No | Only after explicit user confirmation, each time |

Failure it prevents: a worker's commits protect its work against a crash, while one owner of the remote keeps history and releases deliberate.

### Versions and the changelog

- Versions use date-based CalVer, `YYYY.M.N`, matching `my-you-eye`. `N` counts releases within the month. Never use semver.
- Anything a site visitor would notice gets one entry under `## [Unreleased]` in `CHANGELOG.md`, in the same commit.
- One entry is one logical line. Do not hand-wrap it, because every renderer reflows it.
- Process changes stay out, because the file is what readers get as release notes.
- A released section is history. Never edit it.

---

## 9. Writing

These rules apply to every sentence committed here.

- One fact per sentence, about twenty words, plain verbs.
- No em-dashes. No "not X but Y". No bold mini-headings inside bullets.
- No dates and no status phrases. Dates belong only in the `PLAN.md` decision log and on `CHANGELOG.md` release headings.
- Give the number or say nothing. A comparative word with no measurement behind it is a claim you have not made.
- Delete the words that survive their own deletion: crucial, delve, pivotal, showcase, tapestry, testament, underscore, vibrant, landscape, key, robust, leverage, seamless, comprehensive.
- No "-ing" clause bolted onto a fact to make it sound deeper.

Site copy written for visitors is exempt from the word-count rule. It still needs the user's approval, because it speaks as the user.

---

## 10. Change-trigger matrix

Touch the left column and the right column moves in the same commit.

| If you change | You must also |
|---|---|
| The tree data file | Update the site map in `PLAN.md` |
| The line engine | Rerun the section 5 motion checks at both widths |
| The leaf contract | Check every existing leaf against it |
| A dependency | Log the reason in `PLAN.md` |
| A shared design token | Check the landing page and one section page |
| Anything in a gate or script | Watch it fail before committing it |
| Anything a visitor would notice | Add a `CHANGELOG.md` entry |
| A component role, text role, or glossary term | Update `DESIGN.md` and the `/kit` page |

---

## 11. Lessons

Each row is a mistake a reasonable agent would repeat. One line, then where to look.

| Do not | Why, and where |
|---|---|
| Assert only that an element has a background or a focus outline | Browser defaults pass both. A smoke test stayed green with the stylesheet removed. Compare against the computed token, as `tests/e2e/smoke.spec.ts` does. |
| Run `astro preview` from a script without `--ignore-lock` | With no TTY it starts as a daemon and exits, and Playwright reports `Process from config.webServer exited early`. See `playwright.config.ts`. |
| Read CI with `gh run list --limit 1` and no `--workflow` | Dependabot's jobs appear in the same list. A watcher attached to one and reported success while the real run was never read. Pass `--workflow validate.yml`, and check the head SHA. |
| Stop a process with `pkill -f <string>` | It matches its own shell's command line, so the shell kills itself mid-script. Record the PID and `kill` it. |
| Trust green tests for how a transition looks | The first spike passed 24 of 24 while its main line was hidden behind the content. Capture frames through the motion and look at them. |
| Judge motion from the lab alone | `scripts/measure-line.mjs` runs Chromium on a synthetic 60Hz clock. It reported normal frames while the user's Firefox on a 144Hz display ran at half rate. Read the `?debug=line` meter from a real browser. |
| Measure an SVG path with `getBoundingClientRect` | Firefox pads the box for the stroke, which reported a false 4px gap. Use `getPointAtLength` with `getScreenCTM`. |
| Chain a gate as `npm run validate \| tail && next` | The chain reads `tail`'s exit code, so a failed gate still ran Playwright against a stale build. Send the output to a file and read `$?`. |
| Animate a scale through to zero with computed matrices | A browser cannot blend a zero-scale matrix, so the long line jumped to full length in one frame, and suites and still frames both missed it. Name the `scaleY` values and sample positions over time, as `tests/e2e/leaf.spec.ts` does. |
| Build a transition from a copy of the line on a covering layer | Every handoff between tricks showed as a seam, and the user saw the root line vanish. The line lives in one world with one camera, and every route change walks it. See `src/line/steps.ts`. |
| Undo a planted defect with `cp` | `cp` prompts on this machine, so the restore silently did nothing and the defect stayed. Commit first, then use `git restore`, and rerun the gate. |

---

## 12. Keeping this file honest

This file improves itself. Agents edit it without being asked, within these rules.

**Check at the end of every task:** did anything go wrong that a reasonable agent would repeat? Did the user correct you? Did verification catch a subagent's mistake? Did a rule here turn out dead or wrong? If yes, change this file in the same commit, and tell the user what changed.

**Add an entry** only when something went wrong and the lesson is absent from `PLAN.md`, the type system, and any test that fails loudly.

**Prefer making the mistake impossible.** A type, a lint rule, or a failing test beats a paragraph. Once a script holds the rule, delete the paragraph and point to the script.

**Every entry states the failure it prevents.** A rule without a reason cannot be judged later, so it never gets deleted, and the file rots.

**Delete aggressively.** An entry is dead when its cause is fixed. This file's failure mode is growing into a junk drawer nobody reads.

**Do not duplicate `PLAN.md`.** Two sources will disagree at the worst moment.

**Ask first** before changing section 1, section 13, or any rule the user set directly in the decision log. Those change through a new decision.

---

## 13. Design consistency

This is the maintainer's first priority for the site. It outranks novelty, and it applies to every page and every agent.

> **Same role, same look.** A button, heading, label, or link that plays one role looks and behaves identically everywhere. A difference needs a stated reason in `DESIGN.md`.

Failure it prevents: small per-page choices add up to a site that looks assembled from unrelated parts.

### Components

- Each UI role has one implementation, listed in `DESIGN.md`. Reuse it. Never restyle it at the call site.
- A new variant needs a new role, and a new role goes in `DESIGN.md` first.
- The dev-only `/kit` page renders every role side by side. Check it after changing any role.

### Typography

- Text uses a closed set of named text roles from `src/styles/`. Each role fixes the font, size, weight, line height, and tracking.
- App code never sets a raw size or weight. `scripts/design-guard.mjs` fails on raw text sizes, hardcoded colors, and arbitrary Tailwind values.
- Body measure stays within 65 to 75 characters.

### Copy

- Say it short and concrete. Name the thing, the number, and the result. Never tell a story where a fact will do.
- Outside article bodies, a block of copy runs at most three sentences. Prefer a list when items are parallel.
- One word per concept, from the `DESIGN.md` glossary. Do not alternate "projects" with "work".
- Labels and headings use sentence case. Controls name their action.
- The same content pattern gets the same structure on every page.

### What to refuse

These mark a page as generated or overdone. A stated reason in `DESIGN.md` can earn one back, except eyebrows.

- A small label or eyebrow above a heading
- Grids of same-size cards with an icon, a heading, and a line of text
- Big-number stat rows with no real data behind them
- Numbered section labels such as 01, 02, 03
- Gradient text, decorative glass or blur, and colored glows
- A thick colored border on one side of a card or callout
- Monospace used to look technical, outside code and data
- Emoji or Unicode characters standing in for icons
- Particles, parallax, cursor effects, marquees, and scroll-triggered entrances on every section
- Inflated copy: "passionate", "crafting", "journey", "bringing ideas to life"

The line is the one authored motion on this site. Everything else stays quiet.

### Review

- Use the `impeccable` skill where available: `impeccable detect` on changed UI, and `critique`, `polish`, `typeset`, and `clarify` for review.
- Inspect in bounded passes: one batched round at desktop and phone widths, fix everything in one batch, confirm once, and stop.
- Where a design skill's push for bold, maximal work conflicts with this section, this section wins.
