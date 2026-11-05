# My evaluation of the PR description prompt

Currently Im using a skill in y current project to create PR's using a pre-difined structure. This skill is evaluated using the EDD framework for the purpose of my stage 3 certification process and try to improve it. The skill I adapted it from is the `pr-description-generator` skill
(`SKILL.md`: six template fields, a type-of-change menu, a migration branch and three rules).

The question I wanted this suite to answer was not "does the model write nice prose?" but
**"does the prompt make the model fill the six fields, pick the right branch, and stay grounded
in the diff?"**

## What is evaluated

| | |
|---|---|
| **Input** | A User Story and a unified diff |
| **Output** | Six fixed fields, in order: *What is this change?*, *Type of change?*, *Why?*, *How?*, *Requires Manual Database Migration?*, *Anything Else?* |
| **Model under test** | Devin SWE-1.7 via `../devin.js` |
| **Grader** | Devin SWE-1.7, fixed, via `grader.js` (retries an empty response), with a custom `rubricPrompt` that receives the story and the diff |
| **Fixtures** | 5 synthetic ASP.NET Core + EF Core changes with a known expected answer |

### The five fixtures

| # | Scenario | Expected behaviour |
|---|---|---|
| 01 | New `PATCH /orders/{id}/status` endpoint + DTO + service + SQL migration + test | `New feature`; migration **Yes** with the SQL statement and no file path in the block |
| 02 | Null discount no longer crashes checkout | `Bug fix`; migration **No**, no code block |
| 03 | Pricing rules extracted into `PriceCalculator` | `Refactoring`; migration No; no claim of new functionality |
| 04 | `customerName` renamed to `customerFullName` + `sp_rename` | `Breaking change`; migration Yes; states what breaks for consumers |
| 05 | Diff with no User Story | Asks for the story and emits none of the six fields |

## Metrics (11)

Deterministic, in `eval-script.js`:

| Metric | What it checks |
|---|---|
| `structure` | Exactly the six headings, in order, nothing before the first one, no extra sections |
| `conciseness` | *What is this change?* is 5–60 words |
| `type-of-change` | The expected option is selected, non-applicable options are not, the menu is pruned |
| `migration-decision` | Yes + SQL block with the expected statement and no path citations, **or** No + no block |
| `grounding` | Expected tokens present, forbidden tokens absent, every file named exists in the diff |
| `backwards-compat` | A breaking change states what breaks and what consumers must do |
| `missing-story` | Without a story: asks for it and emits no fields |

Model-graded:

| Metric | What it checks |
|---|---|
| `why-business` | *Why?* comes from the story, not from the code |
| `how-actionable` | Every bullet in *How?* names a concrete change present in the diff; no filler |
| `no-invention` | Nothing is claimed that the diff does not contain |
| `asks-for-story` | The no-story case asks a real question instead of guessing |

## Results

| Iteration | Prompt | Rows | Pass | Remaining failure |
|---|---|---|---:|---|
| 1 — baseline | `v1-baseline.md` | 5 | **0/5 (0%)** | structure, type, migration, conciseness, missing-story |
| 2 — adapted skill | `v2-skill.md` | 15 (×3) | **14/15 (93.3%)** | one hallucination: claims the mapper uses `Customer.FullName` |
| 3 — SQL rule | `v3-final.md` | 5 | **5/5 (100%)** | — |
| 4 — refactor (Role removed) | `v4-refactor.md` | 5 + 5 | **5/5**, then **4/5** | a filler bullet ("no other changes") |
| 5 — final | `v5-final.md` | 15 (×3) | **15/15 (100%)** | — |

`v5-final.md` is the final prompt. Full narrative in `iteration-log.md`.

## Run it

From the **repository root** (the provider scripts live there):

```bash
# final prompt, both evidence files
npx promptfoo eval -c pr-description/promptfooconfig.yaml --no-cache --no-share \
  -o pr-description/evidence/eval-v5.json -o pr-description/evidence/eval-v5.html

# stability
npx promptfoo eval -c pr-description/promptfooconfig.yaml --repeat 3 --no-cache --no-share

# an earlier iteration
npx promptfoo eval -c pr-description/promptfooconfig.yaml -p pr-description/prompts/v1-baseline.md --no-cache
```

One environment note:

- **`ACP_BACKEND`** is inherited from Devin Desktop and makes the spawned `devin` CLI report
  `Not logged in`. Run `unset ACP_BACKEND` (bash) before the eval.

Scorer self-check (no model calls):

```bash
node pr-description/eval-script.test.js
```

Summarise any result file:

```bash
node pr-description/scripts/summarize.js pr-description/evidence/eval-v5-final-run3.json --failures
```

## Limitations

- **Small n.** Each iteration is 5 fixtures; the final prompt was measured with 3 repeats
  (15 rows). Intermediate iterations were measured once, except where noted.
- **Grader transport.** The Devin CLI occasionally returns an empty response, which promptfoo
  records as `reason: "No output"`. `grader.js` retries those calls up to three times. Runs
  made before the wrapper are kept in `evidence/discarded/` and are not used for comparison.
- **English is out of scope.** Every fixture is in English, and the skill's
  "always respond in English" rule was removed from the prompt rather than left untested.
- **The skill must not be installed while measuring.** If the user-level
  `pr-description-generator` skill is active, the model already has the template and the
  baseline stops being a baseline. This happened and is documented in the log.

## Files

```
pr-description/
├── README.md                  this file
├── promptfooconfig.yaml       providers, rubricPrompt, 5 tests, 11 metrics
├── eval-script.js             deterministic assertions
├── eval-script.test.js        24 self-checks of the assertions
├── grader.js                  retry wrapper for the rubric grader
├── prompts/                   v1-baseline, v2-skill, v3-final, v4-refactor, v5-final
├── fixtures/                  5 scenarios (story + diff)
├── scripts/summarize.js       per-test / per-metric summary of a result file
├── prompt-diff.md             what changed at each version and why
├── load-bearing-audit.md      instruction → metric mapping
├── iteration-log.md           baseline, hypothesis, change, result, reasoning
└── evidence/                  JSON + HTML per iteration
```
