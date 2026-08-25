# Epic 09 — Favorites

## Shared Context

Home-party drink-ordering app. Full details in
`architecture-and-product-spec.md` — read it before starting, especially
Section 2 (Roles — registered `User` vs. anonymous `PartyGuest`) and
Section 4 (`Favorite`).

This Epic assumes Epic 03 (Auth & Accounts) and Epic 06 (Drink &
Ingredient Catalog) are complete. It has **no dependency on Epics 07 or
08** (order lifecycle) — favorites are unrelated to order state — so it
can be built in parallel with those if you're ever splitting work. For a
solo, sequential Claude Code workflow, following the numeric order is
still simplest.

Before touching `apps/mobile`, check your local skills directory for
anything related to Expo or React Native, and use it if present.

## Goal

A registered user can star/save drinks from the menu and see their saved
list. Anonymous guests never see this feature at all — it requires a
persistent account, since favorites are meant to carry across different
parties. This is a plain account-level feature available to any registered
`User` regardless of `isAdmin`/`canCreateParty` or their bartender status
in any given party — favoriting has nothing to do with party-scoped roles.

## Backend Tasks

- Add `Favorite` to the Prisma schema: `userId, drinkId, createdAt`.
- `POST /favorites` / `DELETE /favorites/:drinkId` / `GET /favorites` —
  registered users only, not available to anonymous guests. Reject
  guest-authenticated requests to these endpoints clearly, not silently.

## Frontend Tasks

- A star/heart toggle on drink cards in the menu (Epic 06's screens) and
  the drink detail view, visible only to logged-in users — never rendered
  at all for anonymous guests, not just disabled.
- A dedicated Favorites screen listing a user's saved drinks, reusing the
  same drink-card styling as the menu (Design System Epic, 02).
- Add an entry point to this screen from the Profile screen (Epic 03) —
  that screen was deliberately built minimal and expects later Epics to
  attach to it; this is this Epic's attachment.

## Definition of Done
- A registered user can favorite and unfavorite drinks, and their
  favorites list is correct and persists across sessions.
- The favorite toggle never appears anywhere in the UI for an anonymous
  guest.
- Calling the favorites endpoints directly as an anonymous guest is
  rejected by the API, not just hidden client-side.
- Unit tests cover: favorite/unfavorite for a registered user, and
  rejection of guest access at the API level.
