# Epic 04 — Party Creation & Join Flow

## Shared Context

Home-party drink-ordering app. Full details in
`architecture-and-product-spec.md` — read it before starting, especially
Sections 3 (Core User Journey) and 4 (Data Model, `Party` and
`PartyGuest`).

This Epic assumes Epic 03 (Auth & Accounts) is complete — Admin and
Customer login already exist.

**This Epic modifies a component from Epic 02.** The header QR/code
modal (see Frontend Tasks) needs to be reachable from every header,
guest and bartender alike — which means extending the `HeaderBand`
component Epic 02 already shipped, not just adding new files. This is
expected: Epic 02 delivered the initial design system, and later Epics
are allowed to extend it when a genuinely cross-cutting need like this
one comes up. Don't rebuild `HeaderBand` from scratch — modify it in
place so every screen that already uses it picks up the change
automatically.

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
Separately, the app has a real entry point that isn't a party code: a
landing screen offering "Join a Party" or "Log In," so an account is
clearly usable on its own, not just as a side effect of joining
something. And from anywhere in the app, anyone can reopen the current
party's QR/code from a small icon in the header.

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

- **App Landing screen.** This is the app's actual root/entry point — no
  party context at all. Two options, nothing else: **"Join a Party"**
  (leads into the join flow below) and **"Log In"** (links to Epic 03's
  Customer login, landing on the Profile screen). The Admin login route
  is **not** shown or linked here — it's reachable only via its own
  direct route (Epic 03), deliberately kept out of guest-facing UI.
- **Join Entry screen.** Reached two ways, and should handle both
  gracefully as the same screen: (a) a QR scan opens this page with the
  party already resolved from the URL — show the party name/code
  confirmed and a clear way to continue; (b) tapping "Join a Party" from
  the App Landing screen with no code yet — show a text input for the
  backup code instead. Validate against `GET /parties/:code` and show a
  clear "invalid or ended party" state if it doesn't resolve. Both paths
  converge on the Identify screen next.
- **Identify step.** After a valid code/QR is confirmed, show a choice:
  log in (existing Customer credentials, reusing Epic 03's login) or
  enter a temporary name (anonymous guest path). No role selector is ever
  shown here — this screen only ever produces a customer or guest
  identity, never bartender status (see Epic 05).
- **Bartender Home screen.** What an Admin/bartender lands on after
  logging in — **build this Epic's version as an empty state only**: no
  active party yet, just a "Create Party" action that triggers
  `POST /parties` and then shows the resulting QR/backup code inline
  (or via the header modal below — your call, but don't build a
  separate dedicated "here's your QR" screen distinct from this one).
  Epic 08 later fills this same screen in with the live order queue once
  orders exist as a feature — you're building the shell and the
  empty/create state now, not a placeholder to be thrown away.
- **Header QR/code modal.** A small icon added to the `HeaderBand`
  component (Epic 02) — present on **every** header, guest-facing (teal)
  and bartender-facing (coral) alike. Tapping it opens a modal overlay
  showing the current party's QR code and backup code, so anyone can
  pull up the invite info from any screen, not just at the moment of
  party creation. On guest-facing screens this is just informational
  (re-displaying what they already used to join); on the Bartender Home/
  Dashboard it's the primary way to re-share the invite with late
  arrivals.
- Store the resulting party-scoped session (guest JWT or the party
  association for a logged-in customer) so subsequent screens know both
  "who is this person" and "which party are they currently in."

## Definition of Done
- The App Landing screen offers only "Join a Party" and "Log In" — no
  Admin option visible anywhere in this UI.
- An Admin can log in, land on Bartender Home, create a party from its
  empty state, and see a working QR + backup code.
- Scanning the QR with a phone's system camera app opens the Join Entry
  screen directly in the browser with the party already identified.
- Tapping "Join a Party" with no code yet leads to the same screen asking
  for the backup code instead.
- A guest can join anonymously with just a temp name and receives a valid
  party-scoped session with no persistent account created.
- A registered Customer can log in and join the same way, and their
  session correctly reflects both their persistent identity and their
  current party.
- An invalid or ended party code shows a clear error state rather than a
  broken or blank screen.
- The header QR/code icon is present and functional on at least one
  guest-facing screen and on Bartender Home, reopening the same
  QR/backup code from anywhere.
- Unit tests cover code/QR generation uniqueness, guest JWT scoping, and
  rejection of joins to an inactive/nonexistent party.

## v2 addition (not needed now)
Once native builds exist: the QR/URL scheme gains a custom-scheme
handoff to the installed app with a store-link fallback, an in-app
camera-based scanner (`expo-camera`) for guests already inside the app,
and eventually true OS-verified Universal Links / App Links for a
flicker-free handoff. None of this blocks v1.
