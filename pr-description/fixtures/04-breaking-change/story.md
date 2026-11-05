# US-4190 — Rename customerName to customerFullName in the order API

## User story

As an API consumer, I want the order payload to use customerFullName, so that the field name matches what it actually contains.

## Business context

The field returns the first and last name concatenated, but its name suggests only the first name. Two partner integrations already misread it and displayed the wrong value to their users. Renaming now avoids more bad data downstream.

## Acceptance criteria

- The order API returns customerFullName instead of customerName.
- The database column is renamed to match.
- Existing integrations are told the field was renamed.
