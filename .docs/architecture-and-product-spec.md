# 112 & Tonic — Architecture & Product Specification

This document is the single source of truth for the product, data model, and
architecture. It is self-contained: every decision below is final for v1
unless explicitly marked as a v2 item. Read this in full before implementing
any feature.

---

## 1. Product Overview

A drink-ordering app for home parties. One host runs the event. Guests browse
a fixed drink menu on their phones and submit orders. One or more bartenders
manage incoming orders from a live dashboard. Both sides get real-time status
updates, with a push notification sent to the customer only when their drink
is ready.

**Scale target:** 10–30 concurrent guests, 1–3 active bartenders per party.
**Usage pattern:** the app runs in short bursts — a single party lasting
roughly 5–6 hours, happening once every 1–3 months. It is not expected to
serve continuous daily traffic.

---

## 2. Roles & Permissions

There are three roles. Only two of them are backed by a persistent global
account.

### Admin
- A single global account (the host). Not expected to scale to multiple
  admins for the foreseeable future, but the data model should not hard-code
  a single-admin assumption.
- Owns the drink and ingredient catalog: creating, editing, and (in v2)
  stocking ingredients.
- Creates party sessions.
- Is automatically the first bartender of any party they create.

### Bartender
- **Not a global account type.** It is a permission scoped to a single
  party, recorded as a relationship between a registered customer account
  and a specific party.
- The party creator (the Admin) is bartender #1 by default.
- Any active bartender (or the Admin) can promote another participant to
  bartender **for that party only**, at any point during the event.
- **Only participants who joined with a registered account can be promoted.**
  Anonymous/temporary-name guests can never become bartenders.
- Bartender status must be checked against the database at request time, not
  trusted from a static JWT claim — promotion can happen after a token was
  already issued, so the source of truth is the party-bartender relationship
  table, not the token payload.
- Bartenders can claim, update, and cancel orders. Bartenders cannot edit the
  drink/ingredient catalog — that stays an Admin-only action.

### Customer
Two paths, chosen at join time, both valid:
- **Registered customer**: has an email + password account. Gets persistent
  order history and can mark drinks as favorites. Accounts persist across
  separate parties.
- **Anonymous / temporary guest**: picks a display name scoped to a single
  party. Nothing about their identity is stored beyond that party. They
  cannot be promoted to bartender and have no order history or favorites.

There is **no role selector** anywhere in the join flow. Every participant
joins the same way (see Section 3). Bartender status is only ever granted
after joining, by someone already trusted — never self-declared at the door.

---

## 3. Core User Journey

1. **Admin creates a party.** This generates a short human-readable backup
   code and a QR code encoding a join URL for that party.
2. **Guests join** one of two ways:
   - Scan the QR with their phone's system camera. Since v1 ships as a web
     app only (see Section 6), the QR simply encodes a plain URL — no
     installed-app handoff logic, no fallback flicker, no App/Play Store
     redirect. It opens directly in the browser.
   - Enter the human-readable backup code manually on the join page — the
     reliable fallback for anyone who can't or doesn't want to scan.
3. **Identify themselves**: log in to a registered account, or enter a
   temporary name for this party only.
4. **Browse the fixed drink menu** and submit an order.
5. **Order enters `pending`.** Any active bartender can claim it
   (first-to-claim wins — the order becomes locked to that bartender, and
   other bartenders see it as claimed by someone else).
6. **Order proceeds through**: `pending → claimed → preparing → ready`, or
   `cancelled` at any point up to `preparing`.
7. **Customer is notified only when the order reaches `ready`.** No
   notification is sent for intermediate states.
8. **Customers can cancel or edit their own order** only while it is still
   `pending` or `claimed`. Once it reaches `preparing`, it can no longer be
   changed by the customer.

### Deep-linking and native install flows — deferred to v2
Everything involving an installed app — a custom URL scheme handoff from
a QR scan, App/Play Store redirects, an in-app camera-based QR scanner,
and eventually true OS-verified deep links (iOS Universal Links / Android
App Links) — only becomes relevant once native builds exist (Section 6,
v2). None of it is needed for v1 to function correctly, since there's no
installed app to hand off to yet.

---

## 4. Data Model

Core entities and their relationships. Field lists are representative, not
exhaustive — implementation may add operational fields (timestamps, soft
deletes, etc.) as needed.

- **AdminAccount** — `id, email, passwordHash, name, createdAt`
- **Customer** — `id, email, passwordHash, name, createdAt`
  - Has many `Order`
  - Has many `Favorite` (join to `Drink`)
  - Has many `PartyBartender` (parties where this customer is a bartender)
- **Party** — `id, code, qrToken, status (active|ended), createdByAdminId, createdAt, startedAt, endedAt`
- **PartyBartender** — `id, partyId, customerId, promotedAt` — join table;
  `customerId` must reference a registered `Customer`, never an anonymous
  guest.
- **PartyGuest** — `id, partyId, tempName, createdAt` — ephemeral, scoped to
  one party, not linked to any persistent identity.
- **Drink** — `id, name, description, category (fixed enum), imageUrl (optional), active`
  - `name` is **never translated** — cocktail names stay as-is regardless of
    UI language (e.g. "Martini" stays "Martini").
  - `category` is a small, fixed, developer-defined taxonomy (e.g.
    cocktail, mocktail, shot, beer, wine, non-alcoholic), defined as a
    TypeScript enum/union in `libs/shared-types` so the Prisma schema and
    both frontend targets can't drift out of sync. It drives the menu's
    category filter chips (single-select, "All" as the default) and the
    fallback swatch for drinks without a generated icon.
  - `imageUrl` stores a custom, stylized icon generated per drink (via
    Claude Design, from a reference photo) rather than a photo — it's
    nullable, and the UI falls back to a plain category-color swatch for
    any drink that doesn't have one yet.
  - `price` field reserved but unused in v1 (no billing yet — see Section
    12).
- **Ingredient** — `id, name (JSON: { en, ro }), unit, currentStock (v2 only)`
  - `name` is a translated JSON object, not a static-file lookup key,
    because ingredients are managed dynamically through the admin panel
    and must not require a code change to add a new one in any language.
- **DrinkIngredient** (recipe line) — `drinkId, ingredientId, quantity, instructions (JSON: { en, ro })`
  - Recipe steps/instructions are translated the same way as ingredient
    names — stored as data, not static strings.
- **Order** — `id, partyId, customerId (nullable), guestId (nullable), drinkId, status, claimedByBartenderCustomerId (nullable), createdAt, updatedAt, readyAt`
  - Exactly one of `customerId` / `guestId` is set per order.
  - `status ∈ { pending, claimed, preparing, ready, cancelled }`
- **Favorite** — `customerId, drinkId, createdAt` — registered customers
  only.

---

## 5. Authentication

- **Admin**: email + password → JWT with an admin claim.
- **Customer**: email + password → JWT with a customer claim and
  `customerId`. No email verification and no OAuth/magic-link flow in v1
  (see Section 14 for future login methods).
- **Anonymous guest**: no credentials. On joining a party, the server issues
  a short-lived JWT scoped to that specific party and guest name, expiring
  when the party ends (or after a fixed TTL).
- **Bartender authorization**: not encoded as a durable JWT claim. Every
  bartender-gated request is checked against the `PartyBartender` table at
  request time, since promotion can happen mid-session after a customer's
  token was already issued.

---

## 6. Architecture & Monorepo

**Nx monorepo** with:
- `apps/api` — NestJS + Prisma + PostgreSQL
- `apps/mobile` — Expo (React Native + Web targets), Expo Router with
  role-gated layouts
- `libs/shared-types` — shared TypeScript DTOs used by both apps

**Platform scope for v1: web only.** The app is built and shipped as an
Expo web export for v1 — no App Store or Play Store submission, no
Apple Developer account, no EAS native builds. Every role (customer,
guest, and bartender/admin) uses the web build.

**iOS and Android are a planned v2 addition, not a rewrite.** The
component library built in the Design System Epic (02) is deliberately
custom-drawn and platform-agnostic — no code depends on web-only or
native-only APIs — specifically so that compiling native builds later via
EAS Build is a matter of *adding* a build target, not restructuring the
app. See Epic 02's theming architecture for how this is kept cheap.

**Deployment (v1, web):** Expo's static web export is served by a
dedicated **nginx container**, which also acts as the reverse proxy and
TLS termination point for the API and Socket.IO traffic (`/api`,
`/socket.io` proxied to the NestJS container; everything else served as
static files). This is the only deployment target for v1 — there is no
separate native deployment pipeline yet.

**Runtime stack:**
- State: TanStack Query for server state, Zustand for cart/local state
- Real-time: Socket.IO for active sessions, rooms scoped per party (room key
  = party code)
- Push (backgrounded/closed app): **Web Push only for v1** (browser
  sessions). Expo Push (for native app tokens) is added alongside the v2
  native builds — the notification dispatch logic is already decoupled
  from order business logic via NestJS `EventEmitter2` specifically so
  that adding a second channel later doesn't touch order logic at all —
  see Section 16 and Epic 08.
- Database: PostgreSQL via Prisma

---

## 6a. Visual Design System

The app's visual language (color palette, typography, shape/surface
language, and the reusable component library) is documented separately in
the Design System Epic file rather than in this document, since it's
implementation-facing detail rather than an architectural decision. It
must be built before any feature-facing screen (Epic 03 onward) and every
later Epic composes its UI from the component library it produces. The
visual design itself is unified across iOS, Android, and Web by design —
but v1 only *ships* on web (Section 6); iOS and Android are a v2
build-target addition using the exact same components, not a per-OS
redesign.

---

## 7. Real-Time Behavior & Reconnection

- Active clients receive order/status updates live via Socket.IO.
- **On reconnect** (network drop, app backgrounded and resumed, server
  restart), the client performs a fresh fetch of current party state via a
  normal API call — not just resuming the event stream — before handing off
  to Socket.IO again. This guarantees a client that missed events while
  disconnected still ends up with accurate state, using TanStack Query's
  `refetchOnReconnect` behavior.
- **Order claiming concurrency**: first-to-claim wins, enforced with a
  database-level transaction/row lock so two bartenders cannot both claim
  the same order in a race.
- **If a customer is disconnected at the moment they try to submit an
  order**, the UI shows a connection-lost state and disables submission
  until reconnected. There is no client-side offline order queue in v1.

---

## 8. Rate Limiting & Abuse Prevention

- Backend: `@nestjs/throttler`, applied globally with a stricter limit
  specifically on the order-creation endpoint.
- Frontend: the order submit button is disabled while the creation mutation
  is in flight (TanStack Query `isPending`), preventing accidental
  double-submission from a double-tap.
- No further abuse prevention (CAPTCHAs, account verification, etc.) is in
  scope for v1.

---

## 9. Internationalization

Two supported languages: **English (default) and Romanian.**

- **Static UI chrome** (buttons, labels, status text, all developer-authored
  strings) — handled with `i18next` + `react-i18next`, translation strings
  in JSON files (`en.json`, `ro.json`), with `expo-localization` used to
  auto-detect the device/browser locale on first load. A manual toggle lets
  the user override it.
- **Dynamic, admin-managed content** (ingredient names, recipe
  instructions) — stored as translated JSON directly on the relevant
  database row (see Section 4), so adding a new ingredient never requires a
  code change or redeploy.
- **Drink names are never translated**, in either mechanism.

---

## 10. Observability & Analytics

**PostHog** (cloud, free tier) is the single tool for analytics, error/
exception tracking, and log ingestion — covering both product usage
insights and crash/error alerting in one integration. No separate error-
tracking tool (e.g. Sentry) is used; PostHog's free tier already includes
exception tracking alongside analytics, and comfortably covers this
project's scale.

---

## 11. Security & Infrastructure Hardening

The production server requires baseline hardening before it's exposed to
real guests:
- **SSH**: key-only authentication; password login disabled entirely.
- **Firewall (UFW)**: only ports 80 and 443 exposed publicly. PostgreSQL is
  never published to the host — it's reachable only from other containers
  on the internal Docker network.
- **Automatic OS security updates** via `unattended-upgrades`.
- **`fail2ban`** on SSH to blunt brute-force login attempts.
- **HTTPS**: TLS termination handled at the nginx layer (e.g. via Let's
  Encrypt / Certbot).

---

## 12. Deployment & Infrastructure

- **Host**: a single Hetzner Cloud VPS, provisioned once and left running
  continuously — Hetzner bills for the server's existence regardless of
  whether it's powered off, so there's no cost benefit to destroying and
  recreating it between parties. Continuous provisioning also avoids
  rebuilding infrastructure and re-migrating the database before every
  event.
- **Stack**: one Docker Compose file running the NestJS API, PostgreSQL, and
  the nginx container together on that VPS.
- **"Live" and "stop" are container-level operations, not server-level
  ones**: `docker compose up -d` brings the stack up and makes the app
  publicly reachable; `docker compose down` stops it. The Postgres data
  volume persists on disk in both states — nothing is lost by stopping the
  containers.
- **CI/CD**: GitHub Actions.
  - A standard pipeline runs on every pull request into `main`: lint, unit
    tests, build check. It does **not** deploy anything.
  - Two manually triggered (`workflow_dispatch`) pipelines exist:
    **"Go Live"** (SSHes into the VPS and runs `docker compose up -d`) and
    **"Stop"** (SSHes in and runs `docker compose down`). Merging to `main`
    never makes the app publicly live by itself — only an explicit manual
    trigger does.

---

## 13. Environments

Two environments for v1: **local development** (Docker Compose on the
developer's machine, dev-default credentials) and **production** (the
Hetzner VPS, `docker-compose.prod.yml` overrides with real secrets,
`NODE_ENV=production` on the API to disable verbose debug output and
detailed stack traces in error responses). The Expo web build reads its
API URL from environment configuration the same way — dev vs. prod values
swapped per environment. EAS build profiles (`development`, `preview`,
`production` in `eas.json`) for native builds are a v2 concern, added
alongside the native platform work in Section 16. There is no staging
tier in v1 — it's a v2 addition, valuable once there are multiple
contributors or real payment flows to test safely.

---

## 14. Testing

Unit tests are written from the start of implementation (not deferred),
covering critical logic in particular: order state transitions, claim-
concurrency handling, and auth/permission guards. Tests run in CI on every
pull request.

---

## 15. Out of Scope for v1

- **Native iOS/Android builds.** v1 ships as a web app only — no App
  Store/Play Store submission, no EAS native build, no installed-app
  install flow.
- Payments / billing (the `Drink.price` field exists in the schema but is
  unused)
- Ingredient stock tracking and automatic menu availability
- Custom URL scheme handoff, in-app camera QR scanning, App/Play Store
  redirects, and OS-verified Universal Links / App Links — all of these
  only become relevant once a native build exists (see Section 16)
- Expo Push notifications (Web Push only — see Section 16)
- OAuth and magic-link login (email + password only)
- A staging environment
- Any abuse prevention beyond basic rate limiting (Section 8)

## 16. v2 Roadmap (not to design against now, but not to block either)

- **Native iOS and Android builds via EAS Build**, using the exact same
  component library from the Design System Epic — not a rewrite. This is
  the highest-leverage v2 item since several other v2 items depend on it:
  - **Expo Push notifications**, added as a second channel alongside
    Web Push once native app tokens exist to send to.
  - **OS-verified Universal Links / App Links**, so a QR scan opens the
    installed app directly with no browser fallback flicker.
  - **In-app camera-based QR scanning** for guests already inside the
    installed app.
  - Optionally, per-OS native-feeling conventions (iOS HIG / Material
    Design navigation patterns) — the Design System Epic's theme
    architecture is what makes this an isolated change rather than a
    rewrite, if it's ever wanted.
- **Ingredient stock tracking**: Admin sets ingredient stock levels when
  configuring a party; each prepared drink deducts the relevant quantities
  per its recipe; any menu item missing a required in-stock ingredient is
  automatically marked unavailable. Admin owns stock configuration;
  bartenders adjust/deplete stock live during the event.
- OAuth (Google/Apple) and magic-link login, in addition to email/password
- A staging environment
- Payment/pricing enforcement per order

---

## 17. Accepted Risks

These were identified and consciously accepted rather than designed
against for v1:
- **Anonymous guests can never be promoted to bartender**, including in the
  edge case where no registered participant is available to promote.
- **No offline order queue** — a disconnected customer simply cannot submit
  until reconnected.
- **No staging environment** — changes are tested locally and shipped
  straight to production between parties.
