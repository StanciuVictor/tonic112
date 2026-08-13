# Epic 08 — Notifications

## Shared Context

Home-party drink-ordering app. Full details in
`architecture-and-product-spec.md` — read it before starting, especially
Section 6 (the `EventEmitter2` decoupling pattern) and Section 3 (only the
`ready` status triggers a customer notification — no notification for any
other status change).

This Epic assumes Epic 07 (Order Lifecycle & Real-Time Claiming) is
complete.

**Platform note:** v1 ships as a web app only (see the Foundation Epic),
so this Epic only needs **Web Push** — there's no installed native app to
register an Expo Push token for yet. The `EventEmitter2` decoupling
pattern below matters *specifically because* it's what makes adding Expo
Push as a second channel in v2 a small, isolated addition rather than a
rework of order logic — don't skip that architecture just because there's
only one channel to wire up right now.

Before touching `apps/mobile`, check your local skills directory for
anything related to Expo or React Native, and use it if present — push
notification permission flows and token registration are a common area
for purpose-built skills to help with.

## Goal

When an order reaches `ready`, its customer/guest is notified via a Web
Push notification even if their browser tab is backgrounded or closed —
without coupling that notification logic into the order-status business
logic itself.

## Backend Tasks

- When an order's status is updated to `ready` (Epic 07's status-update
  endpoint), emit a domain event via NestJS `EventEmitter2` (e.g.
  `order.ready`) rather than calling notification logic directly inline.
  The order-update code should have no knowledge of *how* the recipient
  gets notified.
- A separate notification module listens for `order.ready` and dispatches
  via Web Push to the order's recipient (customer or guest) using their
  registered subscription. Structure this dispatch step as its own
  function/service specifically so that adding an Expo Push branch in v2
  is a matter of adding a second dispatch path, not restructuring this
  module.
- Add whatever push-subscription storage is needed: e.g. a `PushToken`
  table (`id, customerId (nullable), guestId (nullable), type, token/
  subscription payload, createdAt`). Include the `type` field now (even
  though only `web` is ever written in v1) so the v2 addition of `expo`
  tokens doesn't require a schema migration.
- `POST /push-tokens` — registers a subscription for the current
  authenticated identity (customer or guest), callable after permission is
  granted client-side.
- Notification payload should support a deep link back to the specific
  order/party screen (needed for the frontend's deep-link handling below).
- No notification is ever sent for `pending`, `claimed`, `preparing`, or
  `cancelled` — only `ready`. Do not add configuration to change this for
  v1; it's a deliberate product decision, not an oversight.

## Frontend Tasks

- Request Web Push notification permission at an appropriate point in the
  flow (e.g. right after joining a party, not at cold app launch, so the
  ask has context).
- On permission grant, register the resulting subscription via
  `POST /push-tokens`.
- Handle a received "order ready" notification by deep-linking directly to
  that order's screen when tapped.
- Handle permission denial gracefully — the app must remain fully usable
  without push notifications; the customer can still see their order
  reach `ready` live in-app via Socket.IO if their tab is in the
  foreground, push is purely for the backgrounded/closed case.

## Definition of Done
- An order reaching `ready` results in an actual Web Push notification
  being delivered to a browser with a registered subscription.
- No notification fires for any other status transition — verified with a
  test, not just manual observation.
- Tapping the notification opens directly to the relevant order/party
  screen.
- The app functions correctly (order status still visible in-app) for a
  user who denies push permission entirely.
- Unit tests cover: the `order.ready` event firing exactly once per
  transition into `ready`, and correct dispatch to a recipient's
  registered subscription.

## v2 addition (not needed now)
Once native builds exist: Expo Push is added as a second dispatch channel
alongside Web Push, using the same `order.ready` event and the same
`PushToken` table (just a second `type` value). No change to order
business logic is required — that's the point of keeping notification
dispatch decoupled via `EventEmitter2` from the start.
