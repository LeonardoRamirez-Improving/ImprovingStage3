# Prompt diff — from the skill to the evaluated prompt

What changed between the original `SKILL.md` and each version, why, and which metric makes the
change observable. Nothing was changed without a reason that a test could detect.

## SKILL.md → v2 (adaptation)

The skill is written for an interactive agent that can read the workspace. The eval runs one
turn against a fixed diff, so the prompt had to become self-contained.

| Change | Why | Metric |
|---|---|---|
| `analyze the code changes in the current workspace` → *use only the User Story and the diff, do not read files* | The workspace is not part of the fixture, and `devin.js` runs with tools enabled: without this, the model can read the repo and describe something else | `grounding` (foreign file names fail) |
| Added: *if the User Story is missing, ask for it and output nothing else* | The skill says "ask the user" but never says what not to do; the no-story case otherwise produces an invented description | `missing-story`, `asks-for-story` |
| `Be concise but complete` → *maximum 60 words* on *What is this change?* | "Concise but complete" cannot pass or fail. A number can | `conciseness` |
| Added: *use exactly these six headings, in this order, start with the first, no title or preamble* | The model otherwise invents its own layout and opens with "Here is the PR description" | `structure` |
| Added: *answer Yes with the SQL as a fenced block, or No with no block* | The skill states the branch but not the shape; the two branches are the most checkable part of the task | `migration-decision` |
| Added: *select only the relevant options and delete the rest* | The skill says it; without a check the model keeps the whole menu | `type-of-change` |
| **Removed:** *Always respond in English* | Every fixture is in English, so no assertion could ever fail on it. An instruction that cannot fail is dead weight | — (out of scope) |
| Kept verbatim | The six field names, the seven type options, "no file path citations in code blocks", "SQL blocks as plain text" | `structure`, `type-of-change`, `migration-decision` |

## v2 → v3 (SQL hygiene)

| Change | Why | Metric |
|---|---|---|
| *Reproduce only the SQL statements. Do not copy header comments, file paths, or any other non-SQL text into the block.* | Observed in two runs: the model copied `-- src/Infrastructure/Migrations/...` from the top of the SQL file into the code block, violating the skill's own rule | `migration-decision` |

Nothing else changed. The delta between v2 and v3 is one instruction.

## v3 → v4 (refactor)

| Change | Why | Metric |
|---|---|---|
| **Removed:** *You are a senior software engineer writing the PR description…* | No assertion depends on the persona; the rubrics judge content. Removing it is the load-bearing test | all (held at 5/5, then 4/5 for an unrelated reason) |

## v4 → v5 (final)

| Change | Why | Metric |
|---|---|---|
| *List only changes that are present in the diff. Do not add a bullet that says there are no other changes or that nothing else changed.* | A run ended *How?* with a "no other changes" bullet, which names an absence instead of a change | `how-actionable` |
| *Output one option, or two when two genuinely apply. Never output the full list.* | A run kept all seven type options | `type-of-change` |
| **Removed:** *in English* from the task sentence | Same reason as the rule above: untestable with English fixtures | — |

## What was deliberately not carried over

- **The interactive "ask the user" loop.** The eval is one turn. The only interactive behaviour
  kept is the missing-story question, because it is observable in one turn.
- **Reading the workspace.** Replaced by the injected diff. This is the main deviation from the
  skill, and it is what makes the eval reproducible.
- **The English rule.** Out of scope by decision: every input is English, so the instruction
  could not be falsified.

## What stayed identical

The six field names and their order, the seven type options with their exact wording, the
migration Yes/No branch, and the two formatting rules (no path citations in code blocks, SQL as
plain text). Those are the skill's contract, and the eval exists to protect them.
