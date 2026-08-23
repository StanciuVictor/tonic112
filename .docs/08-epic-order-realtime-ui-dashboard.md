# Epic 08 — Order Real-Time UI & Bartender Dashboard (Frontend)

## Shared Context

Home-party drink-ordering app. Full details in
`architecture-and-product-spec.md` — read it before starting, especially
Section 3 (Core User Journey), Section 7 (Real-Time Behavior &
Reconnection), and Section 8 (Rate Limiting).

This Epic assumes Epic 07 (Order Data Model & Claiming Logic) is fully
complete, including its concurrency test passing. Everything here is
frontend work built on top of that already-proven backend.

**This Epic enhances an existing screen, not a new one.** Epic 04 already
built the Bartender Home screen with an empty state (create a party, see
its QR/code). Here, that same screen gains a second state: once a party
is active, its body becomes the live order queue described below. Don't
build a separate "dashboard" screen alongside it — extend the one Epic 04
already shipped.

Before touching `apps/mobile`, check your local skills directory for
anything related to Expo or React Native, and use it if present.

## Goal

A customer or guest can submit an order and see its status update live;
a bartender works from a live queue and can claim/advance orders; and a
client that loses connection recovers accurate state on reconnect rather
than relying solely on missed events.

## Frontend Tasks

- **Order submission** (customer/guest): drink selection from the Epic 06
  menu screens, a submit action that's disabled while the creation
  mutation is in flight (TanStack Query `isPending`) to prevent
  double-submit, per Section 8.
- **Order status display** (customer/guest): shows their own order(s) and
  current status, updating live via Socket.IO, using the `StatusPill`
  component from the Design System Epic (02).
- **Bartender Home, active-party state**: fills in the live-queue body of
  the screen Epic 04 already built (that Epic's version only had the
  empty/create-party state). Live queue of orders across all statuses,
  claim action on `pending` orders, status-advance actions on claimed
  orders, and a clear indication of which bartender claimed which order
  (per the first-to-claim model — this is not blind to other bartenders).
  The header QR/code icon from Epic 04 continues to work unchanged here.
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

## Definition of Done
- Order status changes appear live on both the customer's and the
  bartender's screens without a manual refresh.
- Cancel/edit availability exactly matches the backend's allowed states on
  both sides.
- A client that's disconnected and reconnects (simulate by toggling
  network) ends up with accurate order state even if it missed events
  while offline.
- Attempting to submit while disconnected shows a clear connection-lost
  state rather than silently failing or hanging.
