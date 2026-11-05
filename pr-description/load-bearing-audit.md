# Load-bearing audit — v5-final.md

Every instruction in the final prompt, the metric that would fail if the
instruction were removed, and how that was checked.

**Result: 20 of 21 instruction elements are asserted by at least one metric (95%).**
My bar was ≥90%. The one exception is listed at the end and is kept deliberately.

| # | Instruction (v5-final.md) | Metric that fails without it | Verified by |
|---|---|---|---|
| 1 | Fill every field using only the story and the diff | `structure`, `grounding` | v1 (no contract) scored 0/4 on structure |
| 2 | If the story is missing, ask for it and output nothing else | `missing-story`, `asks-for-story` | fixture 05; v1 invented a description |
| 3 | The diff is the only source of truth; do not read the workspace | `grounding` | foreign file names fail; no leakage observed in v5 |
| 4 | Base every statement on the diff | `no-invention` | v2 run: hallucinated `Customer.FullName` |
| 5 | The business reason comes from the story, not the code | `why-business` | v1 scored 2/4 |
| 6 | Exactly six headings, in this order, level-3 | `structure` | v1 invented its own layout |
| 7 | Start with the first heading; no title, preamble, summary or extra section | `structure` | v1 opened with a title; the contaminated run opened with "Here is…" |
| 8 | *What is this change?* is 1–2 sentences, max 60 words | `conciseness` | v1 wrote 90+ words |
| 9 | Select only relevant type options and delete the rest | `type-of-change` | v1 selected none |
| 10 | Output one option, or two; never the full list | `type-of-change` | v5 run kept all seven |
| 11 | *Why?* explains the business reason; do not restate the diff | `why-business` | rubric |
| 12 | *How?* lists technical changes by category, only those in the diff | `how-actionable`, `grounding` | rubric + expected tokens |
| 13 | Do not add a bullet saying there are no other changes | `how-actionable` | v4 run 2 failed on that exact bullet |
| 14 | If the diff has a migration: Yes + SQL block | `migration-decision` | v1 never answered the branch |
| 15 | Reproduce only SQL statements; no comments or paths in the block | `migration-decision` | observed in two v2 runs |
| 16 | If the diff has no migration: No + no code block | `migration-decision` | fixtures 02 and 03 |
| 17 | *Anything Else?*: notes for reviewers; write "None" if there is nothing | **not asserted** | see below |
| 18 | A breaking change states what breaks and what consumers must do | `backwards-compat` | fixture 04 |
| 19 | No file path citations or IDE links inside code blocks | `migration-decision` | fixtures 01 and 04 |
| 20 | SQL blocks are plain text only | `migration-decision` | block detection |
| 21 | Every statement must be traceable to the story or the diff | `no-invention` | rubric |

## The one exception (#17)

The "write None if there is nothing" half of *Anything Else?* is not asserted:

- `structure` only requires the heading to exist, not that the body is filled.
- `backwards-compat` only inspects that field on fixture 04, where there is something to say.

It is kept because the field is part of the skill's template and, without the sentence, the
field would be undefined for the three non-breaking fixtures. Making it 100% would mean adding
a non-empty check to `anythingElse`, which would require re-running all five versions to keep
the evidence comparable. At 95% the prompt is above the 90% bar, so the exception is documented
rather than papered over.

## How the count was checked

- Removing the Role line (`v3` → `v4`) is the direct experiment: no metric depended on it, and
  behaviour held. That is why the Role is not in the table.
- Removing the English rule is the other direction: it could not be falsified with English
  fixtures, so it was removed instead of being counted as load-bearing.
- Every other row was exercised by a run that failed for that reason before the instruction
  existed, or by a run that passed after it was added. The mapping is in `iteration-log.md`.
