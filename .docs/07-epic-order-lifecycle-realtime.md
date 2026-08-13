# Epic 07 — Order Lifecycle & Real-Time Claiming

## Shared Context

Home-party drink-ordering app. Full details in
`architecture-and-product-spec.md` — read it before starting, especially
Section 3 (Core User Journey), Section 4 (`Order`/`Favorite`), Section 7
(Real-Time Behavior & Reconnection), and Section 8 (Rate Limiting).

This is the largest and most concurrency-sensitive Epic. It assumes Epic
05 (Roles & Bartender Promotion) and Epic 06 (Drink & Ingredient Catalog)
are complete.

Before touching `apps/mobile`, check your local skills directory for
anything related to Expo or React Native, and use it if present.

## Goal

A customer or guest can submit an order for a drink from the menu; any
active bartender can claim it (first-to-claim wins, with no race
condition allowing two bartenders to claim the same order); the order
moves through its full status lifecycle with live updates on both sides;
and a client that loses connection recovers accurate state on reconnect
rather than relying solely on missed events.

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
  (with status and claim info), used both for initial load and as the
  resync source on reconnect (see Frontend Tasks below).
- **Socket.IO**: a room per party, keyed by party code. Broadcast order
  created/claimed/status-changed/cancelled events to that room. Both
  customers/guests and bartenders in the same party share the same room —
  filter what the UI *displays* on the client side, not by splitting
  rooms.
- Add `Favorite` to the Prisma schema: `customerId, drinkId, createdAt`.
  `POST /favorites` / `DELETE /favorites/:drinkId` / `GET /favorites` —
  registered customers only, not available to anonymous guests.

## Frontend Tasks

- **Order submission** (customer/guest): drink selection from the Epic 06
  menu screens, a submit action that's disabled while the creation
  mutation is in flight (TanStack Query `isPending`) to prevent
  double-submit, per Section 8.
- **Order status display** (customer/guest): shows their own order(s) and
  current status, updating live via Socket.IO.
- **Bartender dashboard**: live queue of orders across all statuses,
  claim action on `pending` orders, status-advance actions on claimed
  orders, and a clear indication of which bartender claimed which order
  (per the first-to-claim model — this is not blind to other bartenders).
- **Cancel/edit**: exposed to the customer/guest only while their order is
  `pending` or `claimed`, and to bartenders up to `preparing`, matching
  the backend's enforcement exactly (the UI should hide, not just
  disable-with-an-error, actions that are no longer valid).
- **Reconnection handling**: on Socket.IO reconnect, trigger a full
  re-fetch of `GET /parties/:code/orders` (TanStack Query's
  `refetchOnReconnect`, or an explicit manual refetch tied to the socket's
  reconnect event) before resuming live updates, so a client that missed
  events while disconnected ends up with accurate state regardless of how
  long it was offline.
- **Offline submission**: if the client is disconnected at the moment of
  submit, show a connection-lost state and disable submission entirely.
  Do not build a client-side offline queue — this is explicitly out of
  scope for v1 (Section 17 of the architecture spec).
- **Favorites**: a simple star/toggle on drinks in the menu, visible only
  to logged-in customers (never shown to anonymous guests).

## Definition of Done
- Two simulated simultaneous claim attempts on the same order result in
  exactly one success and one clear rejection — demonstrated with a test,
  not just manual observation.
- Order status changes appear live on both the customer's and the
  bartender's screens without a manual refresh.
- Cancel/edit availability exactly matches the backend's allowed states on
  both sides.
- A client that's disconnected and reconnects (simulate by toggling
  network) ends up with accurate order state even if it missed events
  while offline.
- The order-creation endpoint is demonstrably rate-limited.
- Favorites work for registered customers and are correctly unavailable
  to anonymous guests, both in the UI and if called directly against the
  API.
- Unit tests cover: all valid/invalid status transitions, claim-race
  handling, cancel/edit window enforcement, and the customer/guest
  ownership check on cancel.
