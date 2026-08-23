# Epic 07 — Order Data Model & Claiming Logic (Backend)

## Shared Context

Home-party drink-ordering app. Full details in
`architecture-and-product-spec.md` — read it before starting, especially
Section 3 (Core User Journey), Section 4 (`Order`), Section 7 (Real-Time
Behavior & Reconnection), and Section 8 (Rate Limiting).

This Epic assumes Epic 05 (Roles & Bartender Promotion) and Epic 06
(Drink & Ingredient Catalog) are complete.

This is a **backend-only** Epic, and deliberately so: it's the single
most concurrency-sensitive piece of the whole app — two bartenders must
never be able to claim the same order — and it needs to be proven correct
on its own, with a passing test, before any UI gets built on top of it.
Epic 08 (frontend) depends on this Epic being fully done first.

## Goal

An order can be created, moves through a well-defined status lifecycle,
and can be claimed by a bartender with a hard guarantee that two
simultaneous claim attempts on the same order can never both succeed.

## Backend Tasks

- Add `Order` to the Prisma schema: `id, partyId, customerId (nullable),
  guestId (nullable), drinkId, status, claimedByBartenderCustomerId
  (nullable), createdAt, updatedAt, readyAt`. Enforce at the application
  level that exactly one of `customerId`/`guestId` is set.
- `status` transitions: `pending → claimed → preparing → ready`, with
  `cancelled` reachable from `pending` or `claimed` only (never from
  `preparing` or `ready` — see Section 3 of the architecture spec).
- `POST /parties/:code/orders` — creates an order in `pending`. Apply
  `@nestjs/throttler` here with a stricter limit than the global default,
  per Section 8.
- `POST /orders/:id/claim` — bartender-gated (via the `BartenderGuard`
  from Epic 05). Must use a database transaction with row-level locking
  (or an equivalent atomic conditional update, e.g. `UPDATE ... WHERE
  status = 'pending'` and checking the affected row count) so that two
  simultaneous claim requests can never both succeed on the same order.
  The loser of the race should receive a clear "already claimed" response,
  not a generic error.
- `PATCH /orders/:id/status` — bartender-gated, advances status along the
  allowed transitions above.
- `PATCH /orders/:id/cancel` — callable by the order's own customer/guest
  only while status is `pending` or `claimed`; also callable by a
  bartender at any point up to `preparing`.
- `GET /parties/:code/orders` — current snapshot of all orders in a party
  (with status and claim info). This is what Epic 08's frontend uses both
  for initial load and as the resync source on reconnect.
- **Socket.IO**: a room per party, keyed by party code. Broadcast order
  created/claimed/status-changed/cancelled events to that room. Both
  customers/guests and bartenders in the same party share the same room —
  filtering what the UI *displays* per role is a frontend (Epic 08)
  concern, not a reason to split rooms here.

## Definition of Done
- Two simulated simultaneous claim attempts on the same order result in
  exactly one success and one clear rejection — demonstrated with a test,
  not just manual observation. **Do not consider this Epic complete
  without this specific test passing.**
- The order-creation endpoint is demonstrably rate-limited.
- Unit tests cover: every valid and invalid status transition, the
  claim-race handling, and the customer/guest ownership check on cancel.
- All endpoints are verified directly (e.g. via a REST client or test
  suite) — no frontend exists yet to exercise them through, and that's
  expected at this stage.
