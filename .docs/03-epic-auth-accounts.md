# Epic 03 — Auth & Accounts

## Shared Context

Home-party drink-ordering app. Full product and architecture details live
in `architecture-and-product-spec.md` in this same folder — read it before
starting, especially Sections 2 (Roles) and 5 (Authentication).

There is one persistent, credentialed account type: **User**. Two
independent boolean capability flags — `isAdmin` and `canCreateParty` —
grant elevated access beyond the baseline registered account; neither
implies the other, and both are granted out-of-band (a direct database
edit) rather than through any registration/request flow — there is no
self-elevation endpoint, in this Epic or any other. A third participant
type, the anonymous per-party guest, has no persistent account and is
built in Epic 04 — do not build it here. Bartender status is a fourth,
separate concept again: it's per-party, not a flag on `User` at all, and is
built in Epic 04/05 via the `PartyMember` join table — do not build it
here either.

Auth is email + password only for v1. No OAuth, no magic links, no email
verification.

Before touching `apps/mobile`, check your local skills directory for
anything related to Expo or React Native, and use it if present.

Before touching `apps/api`, check your local skills directory for
anything related to NestJS and Prisma, and use it if present.

## Goal

Registered accounts can be created and can log in, receive a JWT (carrying
`isAdmin` and `canCreateParty`), and the API can distinguish and gate
requests by those flags. The mobile/web app can register, log in, stay
logged in, and log out.

## Backend Tasks

- Add a `User` model to the Prisma schema:
  `id, email (unique), passwordHash, name, isAdmin (default false), canCreateParty (default false), createdAt`.
  Neither flag is ever settable via a request body — both stay `false` on
  every account created through registration.
- Password hashing via bcrypt (or argon2) — never store plaintext.
- `POST /auth/register` and `POST /auth/login` — one pair, not split by
  role. Every account starts with both flags `false`; granting either is a
  manual, out-of-band action for v1 (see the architecture spec, Section 5).
- JWT issuance on successful login, containing `sub` (the user id),
  `isAdmin`, and `canCreateParty`. Use short-to-medium expiry with refresh
  handled however is simplest for a solo-maintained app (a long-lived
  token is acceptable for v1 given the app is only ever live for a few
  hours at a time).
- NestJS guards that can gate a route on `isAdmin` and/or `canCreateParty`
  (e.g. a combined guard reading the relevant JWT claim(s), applied
  per-route via a decorator).
- `GET /auth/me` — returns the current authenticated identity, including
  both flags, used by the frontend to restore session state on load.

## Frontend Tasks

- **One shared login/register form**, reused across two distinct entry
  points: a public one for customers/guests (linked from Epic 04's landing
  screen and join flow), and a separate, unlinked route for logging in as
  someone who holds `canCreateParty`. Both submit to the same backend
  endpoints — the split is purely about frontend discoverability, not a
  different auth mechanism. The `canCreateParty` route's real post-login
  destination (Bartender Home) is built in Epic 04, not here — for this
  Epic it just needs to exist, authenticate correctly, and not be
  reachable from anywhere in the guest-facing UI.
- **A minimal Profile screen** — the destination for a registered user who
  logs in _without_ a party in play (see Epic 04's landing screen). For
  this Epic, build just: name/email display and a logout action. Later
  Epics attach more to this same screen (Epic 09 adds a Favorites link,
  Epic 11 adds the language toggle) — don't build placeholders for those
  now, just make sure this screen exists and is easy to extend.
- Store the JWT using Expo's cross-platform storage abstraction (not a
  web-only browser API directly) — v1 only runs on web, so this only
  needs to actually work there for now, but using the cross-platform
  abstraction from the start means it keeps working unmodified once
  native builds are added in v2 (native storage would otherwise need
  `expo-secure-store` specifically, which the abstraction handles for
  free).
- Auth state lives in Zustand; on app load, if a token exists, call
  `GET /auth/me` to restore session state before rendering anything
  flag-gated.
- Logout clears the stored token and resets auth state.
- Use Expo Router's layout groups to separate what an authenticated
  `canCreateParty` holder, an authenticated regular user, and an
  unauthenticated visitor can navigate to. Full navigation structure will
  keep growing in later Epics — establish the pattern now, don't
  over-build screens that don't exist yet.

## Definition of Done

- A `canCreateParty` account and a regular account can each register, log
  in, and log out through the **web** app. Native verification isn't
  required for v1 (see the Foundation Epic's platform scope note).
- The `canCreateParty` login route is reachable but not linked from
  anywhere a regular user or guest would naturally navigate.
- A user who logs in lands on the Profile screen and can log out from
  there.
- Requests to `isAdmin`-gated and `canCreateParty`-gated endpoints are
  correctly rejected for missing flags or no auth at all.
- Unit tests cover: password hashing/verification, JWT guard rejection
  logic, and the registration/login endpoints.
- Session restores correctly on app reload without requiring re-login.
