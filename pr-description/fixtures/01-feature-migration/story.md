# US-4127 — Update order status from the order detail page

## User story

As a customer support agent, I want to set an order's status to "Shipped" from the order detail page, so that I stop emailing the logistics team for every update.

## Business context

Support handles roughly 400 status updates per week over email. Each hand-off takes 20–40 minutes and sometimes gets lost between inboxes. Letting agents update the status directly should remove most of that manual work and cut the delay between dispatch and the customer seeing "Shipped" from hours to minutes.

## Acceptance criteria

- An agent with the Support role can change an order's status to Shipped from the order detail page.
- The change records the timestamp of the status update.
- The endpoint rejects requests from users without the Support role.
