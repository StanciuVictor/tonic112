# Epic 05 — Roles & Bartender Promotion

## Shared Context

Home-party drink-ordering app. Full details in
`architecture-and-product-spec.md` — read it before starting, especially
Section 2 (Roles), specifically the Bartender subsection.

This Epic assumes Epics 03 and 04 are complete: accounts, login, and party
join (both registered and anonymous) already work.

Before touching `apps/mobile`, check your local skills directory for
anything related to Expo or React Native, and use it if present.

## Goal

Bartender is a **party-scoped permission**, not a global account type. The
party creator is automatically the first bartender. Any active bartender
(or the Admin) can promote another **registered, logged-in** participant
to bartender for that party, at any point during the event. Anonymous
guests can never be promoted.

## Backend Tasks

- Add `PartyBartender` to the Prisma schema: `id, partyId, customerId,
  promotedAt`. `customerId` must reference a `Customer` — there is no path
  for a `PartyGuest` to appear in this table.
- When a party is created (Epic 04), automatically insert a
  `PartyBartender` row for the Admin's associated identity as the first
  bartender of that party. (If the Admin doesn't have a `Customer` row,
  treat Admin-as-bartender as an implicit rule checked alongside the
  `PartyBartender` table, rather than forcing the Admin into the Customer
  table — keep AdminAccount and Customer as distinct tables per Section 4
  of the architecture spec.)
- `POST /parties/:code/bartenders` — body: `{ customerId }`. Only callable
  by an existing bartender or the Admin for that party. Must reject the
  target if they are not a registered, logged-in Customer currently
  associated with the party (i.e., reject any attempt to promote a
  `PartyGuest`).
- `GET /parties/:code/participants` — lists current participants (both
  guests and customers) in a party, with their current role, so the
  frontend can render a promote-able list.
- **Critical implementation detail**: build a `BartenderGuard` that checks
  the `PartyBartender` table at request time for every bartender-gated
  route — do not rely on a static role claim baked into the JWT at login
  time, since promotion can happen after a token was already issued and a
  JWT-only check would miss it.

## Frontend Tasks

- A participant list screen, visible to bartenders/Admin, showing everyone
  currently in the party and their role.
- A "promote to bartender" action on that list, only shown for eligible
  targets (registered customers who aren't already bartenders) and only
  to users who are themselves currently a bartender or the Admin.
- Once promoted, the newly-promoted user's UI should reflect their new
  permissions without requiring them to log out and back in — re-fetch
  their current role/permissions after promotion (e.g. via a re-fetch of
  `GET /auth/me` combined with party-scoped role info, or a party-specific
  "my role in this party" endpoint if that's cleaner than overloading
  `/auth/me`).

## Definition of Done
- The party creator is a bartender from the moment the party is created,
  with no manual step required.
- An existing bartender can promote a logged-in customer participant to
  bartender, and that promotion is immediately reflected in what that
  user's account is authorized to do — without needing a fresh login.
- Attempting to promote an anonymous guest is rejected with a clear error,
  both at the API level and hidden as an option in the UI.
- A non-bartender, non-admin participant cannot call the promotion
  endpoint successfully.
- Unit tests cover: promotion authorization (who can promote), rejection
  of guest promotion, and that bartender status is correctly evaluated
  against the database rather than a stale JWT claim.
