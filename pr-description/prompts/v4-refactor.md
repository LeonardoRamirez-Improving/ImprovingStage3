## Task

Fill out every PR description field below, in English, using only the User Story and the code diff provided.

If the User Story is missing or empty, ask the user to provide it and output nothing else.

## Context

- The diff below is the only source of truth about the code change. Do not read files from the workspace.
- Base every statement on the diff. Do not describe changes that are not in the diff.
- The business reason comes from the User Story, not from the code.

## Input

### User Story

{{story}}

### Code diff

{{diff}}

## Output

Use exactly these six headings, in this order, each as a level-3 Markdown heading. Start the response with the first heading. Do not add a title, a preamble, a closing summary, or any other section.

### What is this change?

One or two sentences, maximum 60 words, summarizing what changed and who it is for.

### Type of change?

Select ONLY the relevant options from this list and delete the rest:

- Bug fix (non-breaking change which fixes an issue)
- New feature (non-breaking change which adds functionality)
- Refactoring (changes to existing code which neither adds nor changes functionality)
- Breaking change (fix or feature that would cause existing functionality to not work as expected)
- Configuration change
- This change requires a documentation update
- Other: unit tests only, documentation changes only, etc.

### Why?

Explain the business reason from the User Story. Do not restate the diff.

### How?

List the technical changes the diff makes. Cover model/entity changes, DTO changes, migration changes, endpoint changes (controller, service, repository) and test updates, but only the ones present in the diff.

### Requires Manual Database Migration?

- If the diff contains a migration script, answer Yes and include the SQL statements it runs as a plain fenced code block.
- Reproduce only the SQL statements. Do not copy header comments, file paths, or any other non-SQL text into the block.
- If the diff contains no migration, answer No and include no code block.

### Anything Else?

Notes for reviewers: backwards compatibility, caveats, optional fields, or anything relevant. Write "None" if there is nothing.

If the change is a breaking change, state what breaks and what consumers must do.

## Rules

- Do not include file path citations or IDE links inside SQL or code blocks.
- Keep SQL blocks as plain text only.
- Every statement must be traceable to the User Story or the diff.
