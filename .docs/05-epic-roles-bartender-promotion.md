# Epic 05 — Roles & Bartender Promotion

## Shared Context

Home-party drink-ordering app. Full details in
`architecture-and-product-spec.md` — read it before starting, especially
Section 2 (Roles), specifically the Bartender subsection, and Section 4
(`PartyMember`).

This Epic assumes Epics 03 and 04 are complete: accounts, login, and party
join (both registered and anonymous) already work. Critically, **every
registered participant already has a `PartyMember` row** for the party
they're in by the time this Epic starts — `role: bartender` for the
party's creator, `role: customer` for everyone else who joined normally.
Creating that row is Epic 04's job, already done. This Epic's job is
narrower than it might sound: promoting an *existing* `PartyMember` row
from `customer` to `bartender`, and enforcing that promotion at request
time. It does not create party membership from scratch.

Before touching `apps/mobile`, check your local skills directory for
anything related to Expo or React Native, and use it if present.

Before touching `apps/api`, check your local skills directory for
anything related to NestJS and Prisma, and use it if present.

## Goal

Bartender is a **party-scoped permission**, not a global account flag —
tracked entirely via `PartyMember.role`. The party creator is already the
first bartender as of Epic 04, with no work needed here to make that true.
This Epic adds the *promotion* path: any active bartender for a party can
promote another **registered, already-joined** participant to bartender
for that party, at any point during the event. Anonymous guests can never
be promoted — they have no `PartyMember` row to promote in the first
place.

## Backend Tasks

- `POST /parties/:code/members/:userId/promote` — flips the target's
  existing `PartyMember` row from `role: customer` to `role: bartender`
  (and sets `promotedAt`). Only callable by an existing bartender for
  that party (checked live, per the guard below). Must reject if the
  target has no `PartyMember` row for this party at all (they haven't
  joined) — this is what makes promoting a `PartyGuest` structurally
  impossible: guests never have a row here to promote. Promoting an
  already-`bartender` row should be a harmless no-op, not an error.
- `GET /parties/:code/participants` — lists current participants in a
  party for the promote-able list: both `PartyMember` rows (registered
  users, with their current `role`) and `PartyGuest` rows (anonymous,
  never promote-able), combined into one view.
- **Critical implementation detail**: build a `BartenderGuard` that checks
  the `PartyMember` table (`role: bartender`, for the specific `partyId`
  in the request) at request time for every bartender-gated route — do
  not rely on a static role claim baked into the JWT at login time, since
  promotion can happen after a token was already issued and a JWT-only
  check would miss it. This is unrelated to and independent of the
  `isAdmin`/`canCreateParty` flags, which *are* trusted directly from the
  JWT (see the architecture spec, Section 5) — bartender status is the
  one thing that always needs the live check.

## Frontend Tasks

- A participant list screen, visible to bartenders, showing everyone
  currently in the party and their role.
- A "promote to bartender" action on that list, only shown for eligible
  targets (`PartyMember` rows with `role: customer`) and only to users who
  are themselves currently a bartender for that party.
- Once promoted, the newly-promoted user's UI should reflect their new
  permissions without requiring them to log out and back in — re-fetch
  their current role/permissions after promotion (e.g. via a party-scoped
  "my role in this party" endpoint, since `GET /auth/me` intentionally
  only carries the durable `isAdmin`/`canCreateParty` flags, not
  party-scoped bartender status).

## Definition of Done
- The party creator is already a bartender from the moment the party is
  created (inherited from Epic 04 — verify it still holds, no new work
  needed to produce it here).
- An existing bartender can promote a logged-in, already-joined
  participant to bartender, and that promotion is immediately reflected in
  what that user's account is authorized to do — without needing a fresh
  login.
- Attempting to promote an anonymous guest is rejected with a clear error,
  both at the API level and hidden as an option in the UI.
- A non-bartender participant cannot call the promotion endpoint
  successfully.
- Unit tests cover: promotion authorization (who can promote), rejection
  of guest promotion and of promoting a user with no `PartyMember` row for
  that party, and that bartender status is correctly evaluated against
  the database rather than a stale JWT claim.
