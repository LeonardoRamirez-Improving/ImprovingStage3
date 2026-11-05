# TECH-91 — Extract pricing rules out of OrderService

## User story

As a developer, I want the pricing rules moved into their own class, so that OrderService stops growing with every pricing change.

## Business context

OrderService is 1,400 lines and every pricing change touches it. Extracting the calculation lets the pricing team change rules without going through order orchestration, and it shortens review time for those changes.

## Acceptance criteria

- The pricing rules live in a dedicated PriceCalculator class.
- OrderService delegates to that class.
- No behaviour changes; the existing tests keep passing.
