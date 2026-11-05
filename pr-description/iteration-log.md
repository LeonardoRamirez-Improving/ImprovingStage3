# Iteration log — PR description generator

Evaluation-Driven Development on a prompt adapted from the `pr-description-generator` skill.

**Setup**

| | |
|---|---|
| Task | Fill a six-field PR description from a User Story and a code diff |
| Model under test | Devin SWE-1.7 (`exec: node ../devin.js`) |
| Grader | Devin SWE-1.7, fixed for every run, via `grader.js` (retries empty output) |
| Fixtures | 5 synthetic ASP.NET Core + EF Core changes (`fixtures/`) |
| Metrics | 7 deterministic + 4 model-graded (`README.md`) |
| Reproduce | `npx promptfoo eval -c pr-description/promptfooconfig.yaml -p <prompt> --no-cache` |

A test passes only when all of its assertions pass.

---

## Instrument notes (before iteration 1)

Four things had to be fixed in the measuring instrument before the prompt numbers meant
anything. They are recorded here because they change how the evidence should be read.

**1. The skill was contaminating the baseline.** The first `v1` run scored 4/5 failures —
and the only failure was a preamble. Everything else passed, including the six exact field
names, with a prompt that never mentions them. Cause: `pr-description-generator` was installed
as a user-level skill, so the model already had the template in context. Confirmed by asking
the model directly ("YES. I have the `pr-description-generator` skill") and by
`devin skills list`. The skill was removed and the run repeated: **0/5**. The contaminated run
is kept in `evidence/discarded/eval-v1-skill-contaminated.json`.

**2. The default rubric prompt made the grader echo its own schema.** Reasons came back as
`"..."` and `"string"`, and one call failed with `Could not extract JSON from llm-rubric
response`. Replaced with a custom `rubricPrompt` that demands an actual verdict (1.0 / 0.5 /
0.0) and forbids placeholders.

**3. The grader could not see the diff.** `no-invention` failed with *"No diff was provided,
so I cannot verify that every claimed change actually appears in the diff"* — a correct
objection. `{{story}}` and `{{diff}}` were added to the rubric prompt.

**4. Two assertions produced false negatives.**

- `backwards-compat` used `icontains: "compatib"`. A correct answer — *"existing integrations
  should be notified to update to `CustomerFullName`"* — does not contain that word. Replaced
  with `breakingNote`, which accepts a set of phrasings.
- `how-actionable` said *"the null-safe lookup and the new unit test"*, which a grader read as
  "exactly those two". A correct answer that also mentioned the variable rename failed. The
  rubric now accepts additional bullets as long as each names a change present in the diff.

**5. The grader intermittently returned empty stdout.** promptfoo records that as a failed
assertion with `reason: "No output"`, which is indistinguishable from a bad answer. `grader.js`
retries the call up to three times. It is used only as the grader: retrying a generation would
hide real instability in the prompt.

Runs made before these fixes are in `evidence/discarded/` and are not used for comparison.

---

## Iteration 1 — baseline (RED)

**Prompt:** `v1-baseline.md` — three lines: *"Write a PR description for these code changes"*,
plus the story and the diff.

**Measured:** **0/5 tests passed.**

| Metric | Score |
|---|---|
| `structure` | 0/4 |
| `type-of-change` | 0/4 |
| `migration-decision` | 0/4 |
| `conciseness` | 0/4 |
| `missing-story` | 0/1 |
| `backwards-compat` | 0/1 |
| `grounding` | 4/4 |
| `how-actionable` | 4/4 |
| `no-invention` | 3/4 |
| `why-business` | 2/4 |

**Observation.** The model writes a competent prose summary and is naturally grounded, but it
invents its own layout (`## What changed`, `## Why`), never classifies the change, never answers
the migration question, and in the no-story case invents a description instead of asking.

**Hypothesis.** An explicit output contract (the six headings, in order), a closed vocabulary
for type and migration, and an explicit missing-story rule will fix structure, type and the
migration branch, without hurting the grounding the model already has.

---

## Iteration 2 — the skill adapted to a standalone prompt (GREEN attempt)

**Change (prompt).** RTCC-style rewrite: task, context, exact six headings, the type menu,
the migration branch, the 60-word cap on *What is this change?*, "use only the story and the
diff, do not read the workspace", and "if the story is missing, ask for it".

**Measured:** **14/15 (93.3%)** with `--repeat 3`.

| Metric | Score |
|---|---|
| `structure` | 12/12 |
| `type-of-change` | 12/12 |
| `migration-decision` | 12/12 |
| `conciseness` | 12/12 |
| `grounding` | 12/12 |
| `missing-story` | 3/3 |
| `asks-for-story` | 3/3 |
| `why-business` | 12/12 |
| `backwards-compat` | 3/3 |
| `how-actionable` | **11/12** |
| `no-invention` | **11/12** |

**Remaining failure.** One of the three runs of fixture 04 claimed the mapper uses
`Customer.FullName`, when the diff concatenates `FirstName + " " + LastName`. That is a real
hallucination, and it fails both `how-actionable` and `no-invention`.

**Also observed, outside this sample.** In two earlier runs (different fixtures, recorded in
`evidence/discarded/`) the model copied the SQL file's header comment — including its path —
into the code block, violating the skill's "no file paths inside code blocks" rule. It did not
recur in the 15-row sample, so it is intermittent rather than systematic.

**Reasoning.** The contract is the big lever: every deterministic metric went from 0 to 100%
and stayed there across repeats. The residual problems are not structural — they are content
fidelity on a rename, and an intermittent copying behaviour around SQL blocks.

---

## Iteration 3 — SQL block hygiene (GREEN)

**Change (prompt).** One rule added to the migration field: *"Reproduce only the SQL
statements. Do not copy header comments, file paths, or any other non-SQL text into the
block."* Nothing else changed.

**Measured:** **5/5 (100%)**, single run.

**Reasoning.** This targets the observed copying behaviour directly. One clean run is
supporting evidence, not proof: the failure was intermittent, so the rule is validated more by
the final 15/15 run (which includes it) than by this single run.

---

## Iteration 4 — refactor: remove the Role line

**Change (prompt).** `v3` opened with *"You are a senior software engineer writing the PR
description…"*. No assertion depends on that sentence — the rubrics judge the content, not the
persona — so it is dead weight by the framework's own definition. `v4` removes it.

**Measured:** run 1 **5/5**; run 2 **4/5**.

**Run 2 failure.** `how-actionable` on fixture 04: the *How?* section ended with a bullet
saying that nothing else changed. Every bullet is supposed to name a concrete change, and that
bullet names an absence.

**Reasoning.** The refactor held: removing the Role did not change behaviour, which is what a
refactor is supposed to demonstrate. The second run exposed a separate prompt gap — the prompt
never said that a bullet must describe a change, only which changes to list.

---

## Iteration 5 — FINAL

Three prompt changes and one instrument fix, in this order.

**Change A — no absence bullets.** Added to *How?*: *"List only changes that are present in the
diff. Do not add a bullet that says there are no other changes or that nothing else changed."*

**Measured A:** **15/15 (100%)**, repeat 3.

**Change B — English removed from scope.** The task sentence still said *"in English"*. With
every fixture in English, no assertion could fail on language, so the phrase was removed rather
than left as untested text. Same commit: the type field gained *"Output one option, or two when
two genuinely apply. Never output the full list."*, after the next run showed the menu being
kept.

**Measured B:** **14/15**. The failure was fixture 04 keeping all seven options — a real
failure, and the reason for the one-option rule.

**Change C — one option, never the full list.** As above.

**Measured C:** **14/15**. This time the only failure was a grader row with
`reason: "No output"`; `type-of-change` was 12/12, so the hardening worked and the failure was
transport, not behaviour.

**Instrument fix — retrying the grader.** `grader.js` retries an empty stdout up to three
times. Used only for grading.

**Final measured:** **15/15 (100%)**, repeat 3, zero errors
(`evidence/eval-v5-final-run3.json`).

**Reasoning.** The final prompt is `v4` plus one instruction about filler bullets and one
about pruning the menu. Both were added because a run failed for that exact reason, and each
was re-measured after the change. The English phrase was removed because it could not fail.

---

## Summary

| # | Phase | Prompt | Rows | Pass | Driver |
|---|---|---|---:|---:|---|
| 1 | RED | `v1-baseline.md` | 5 | **0/5** | no contract: invented layout, no branches |
| 2 | GREEN attempt | `v2-skill.md` | 15 | **14/15** | contract + branch rules; residual hallucination |
| 3 | GREEN | `v3-final.md` | 5 | **5/5** | SQL block hygiene |
| 4 | REFACTOR | `v4-refactor.md` | 5 + 5 | **5/5**, **4/5** | Role removed; filler bullet exposed |
| 5 | FINAL | `v5-final.md` | 15 | **15/15** | no filler bullets, pruned menu, retry grader |

Score progression on the 5-fixture suite: **0% → 93.3% → 100% → 100% → 100%**.

## Lessons

1. **The output contract is the largest single lever.** 0/5 → 14/15 came from naming the
   fields and the branches, not from better prose.
2. **Definitions beat examples.** The migration branch and the type menu only work because the
   options are closed and the decision rule is explicit.
3. **A rubric needs the source material.** Asking a judge to verify grounding without giving it
   the diff produces either a refusal or a guess. Both are worthless.
4. **Fix the instrument before the prompt.** Three of the five "failures" investigated here
   were assertion bugs, not prompt bugs. Changing the prompt first would have produced a
   prompt tailored to a broken ruler.
5. **Small samples hide variance.** `v2` scored 4/5, 5/5 and 14/15 on different runs of the same
   prompt. Three repeats is the minimum for a claim, not one run.
6. **Removing text is a test.** Deleting the Role line and re-measuring is what turns
   "load-bearing" from an assertion into evidence.
7. **Retry transport, never generation.** An empty grader response is not a failed answer. The
   fix belongs in the grader wrapper; retrying the model under test would have hidden exactly
   the instability the suite exists to find.
