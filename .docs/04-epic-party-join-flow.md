# Epic 04 — Party Creation & Join Flow

## Shared Context

Home-party drink-ordering app. Full details in
`architecture-and-product-spec.md` — read it before starting, especially
Sections 3 (Core User Journey) and 4 (Data Model, `Party` and
`PartyGuest`).

This Epic assumes Epic 03 (Auth & Accounts) is complete — Admin and
Customer login already exist.

**Platform note:** v1 ships as a web app only (see the Foundation Epic).
That significantly simplifies this Epic compared to what a native-app
version would need — there's no installed app to hand off to, so the QR
just opens a web page directly. The more involved version of this flow
(installed-app handoff, in-app camera scanning, store fallback) is a v2
addition once native builds exist — see the end of this file.

Before touching `apps/mobile`, check your local skills directory for
anything related to Expo or React Native, and use it if present.

## Goal

An Admin can create a party and get a QR code + backup code. Any
participant — registered or anonymous — can join that party through
either the QR or the backup code, and anonymous guests get a
party-scoped identity without ever creating a persistent account.

## Backend Tasks

- Add `Party` to the Prisma schema: `id, code (short, human-readable,
  unique), qrToken, status (active|ended), createdByAdminId, createdAt,
  startedAt, endedAt`.
- Add `PartyGuest`: `id, partyId, tempName, createdAt` — fully ephemeral,
  never linked to a `Customer`.
- `POST /parties` (Admin only) — creates a party, generates `code` and
  `qrToken`, returns both plus a join URL for QR encoding.
- `POST /parties/:code/join/guest` — body: `{ tempName }`. Creates a
  `PartyGuest` row and issues a short-lived, party-scoped JWT (role
  `guest`, containing `partyId` and `guestId`). No password, no persistent
  identity.
- `POST /parties/:code/join/customer` — for an already-authenticated
  Customer, associates them with the party (no separate party-guest
  record needed; their existing Customer JWT plus a party-membership
  check is sufficient going forward).
- `GET /parties/:code` — public-enough lookup to validate a code/QR before
  committing to the join flow (e.g. so the frontend can show "invalid or
  ended party" before asking for a name).
- Validate that a party is `active` before allowing any join.

## Frontend Tasks

- **Admin: create-party screen.** Triggers `POST /parties`, then displays
  the QR code (rendered from the returned join URL) and the backup code
  prominently, since the Admin will likely be showing this on a shared
  screen or printout at the start of the event.
- **Join landing page.** The QR simply encodes a plain URL to this page —
  no installed-app handoff, no custom URL scheme, no store fallback logic
  (there's no installed app in v1 to hand off to). A phone's system
  camera app scanning the QR opens this page directly in the browser.
  Validate the code against `GET /parties/:code` and show a clear
  "invalid or ended party" state if it doesn't resolve.
- **Backup code entry.** A plain text input on the same landing page for
  anyone joining by typing the code rather than scanning — resolves to
  the exact same join logic as the QR.
- **Identify step.** After a valid code/QR is confirmed, show a choice:
  log in (existing Customer credentials, reusing Epic 03's login) or
  enter a temporary name (anonymous guest path). No role selector is ever
  shown here — this screen only ever produces a customer or guest
  identity, never bartender status (see Epic 05).
- Store the resulting party-scoped session (guest JWT or the party
  association for a logged-in customer) so subsequent screens know both
  "who is this person" and "which party are they currently in."

## Definition of Done
- An Admin can create a party and see a working QR + backup code.
- Scanning the QR with a phone's system camera app opens the join landing
  page directly in the browser, showing the party correctly identified.
- A guest can join anonymously with just a temp name and receives a valid
  party-scoped session with no persistent account created.
- A registered Customer can log in and join the same way, and their
  session correctly reflects both their persistent identity and their
  current party.
- The backup code path produces an identical result to the QR path.
- An invalid or ended party code shows a clear error state rather than a
  broken or blank screen.
- Unit tests cover code/QR generation uniqueness, guest JWT scoping, and
  rejection of joins to an inactive/nonexistent party.

## v2 addition (not needed now)
Once native builds exist: the QR/URL scheme gains a custom-scheme
handoff to the installed app with a store-link fallback, an in-app
camera-based scanner (`expo-camera`) for guests already inside the app,
and eventually true OS-verified Universal Links / App Links for a
flicker-free handoff. None of this blocks v1.
