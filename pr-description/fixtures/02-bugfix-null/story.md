# BUG-3388 — Checkout returns 500 when the cart has no discount

## User story

As an online shopper, I want checkout to complete when my cart has no discount applied, so that I can place my order.

## Business context

2.1% of checkouts failed last week — about 180 orders. All of them had an empty discount record. Support is recreating those orders by hand and customers are abandoning the cart instead of retrying.

## Acceptance criteria

- Placing an order with no discount completes without an exception.
- The order total is unchanged when no discount is applied.
