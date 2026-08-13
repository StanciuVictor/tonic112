# Epic 03 — Auth & Accounts

## Shared Context

Home-party drink-ordering app. Full product and architecture details live
in `architecture-and-product-spec.md` in this same folder — read it before
starting, especially Sections 2 (Roles) and 5 (Authentication).

Two persistent, credentialed account types exist: **AdminAccount** (the
host — expect exactly one in practice, but don't hard-code that assumption)
and **Customer** (registered guests, with order history and favorites in
later Epics). A third participant type, the anonymous per-party guest, has
no persistent account and is built in Epic 04 — do not build it here.

Auth is email + password only for v1. No OAuth, no magic links, no email
verification.

Before touching `apps/mobile`, check your local skills directory for
anything related to Expo or React Native, and use it if present.

## Goal

Registered accounts (Admin and Customer) can be created and can log in,
receive a JWT, and the API can distinguish and gate requests by role. The
mobile/web app can register, log in, stay logged in, and log out.

## Backend Tasks

- Add `AdminAccount` and `Customer` models to the Prisma schema:
  `id, email (unique), passwordHash, name, createdAt`.
- Password hashing via bcrypt (or argon2) — never store plaintext.
- `POST /auth/admin/register` and `POST /auth/admin/login` — admin
  registration should realistically only ever be used once, but don't
  artificially block a second admin from being created; that's a product
  decision for later, not a technical constraint to enforce now.
- `POST /auth/customer/register` and `POST /auth/customer/login`.
- JWT issuance on successful login, containing role (`admin` or
  `customer`) and the relevant id. Use short-to-medium expiry with refresh
  handled however is simplest for a solo-maintained app (a long-lived
  token is acceptable for v1 given the app is only ever live for a few
  hours at a time).
- NestJS guards: an `AdminGuard` and a `CustomerGuard` (or a combined
  `RolesGuard` reading the JWT claim) that can be applied per-route.
- `GET /auth/me` — returns the current authenticated identity, used by the
  frontend to restore session state on load.

## Frontend Tasks

- Login and registration screens, shared as much as possible between the
  Admin and Customer flows (they're structurally identical — email +
  password — just hitting different endpoints and resulting in different
  role state).
- Store the JWT using Expo's cross-platform storage abstraction (not a
  web-only browser API directly) — v1 only runs on web, so this only
  needs to actually work there for now, but using the cross-platform
  abstraction from the start means it keeps working unmodified once
  native builds are added in v2 (native storage would otherwise need
  `expo-secure-store` specifically, which the abstraction handles for
  free).
- Auth state lives in Zustand; on app load, if a token exists, call
  `GET /auth/me` to restore session state before rendering anything
  role-gated.
- Logout clears the stored token and resets auth state.
- Use Expo Router's role-gated layout groups to separate what an
  authenticated Admin, authenticated Customer, and unauthenticated visitor
  can navigate to. Full navigation structure will keep growing in later
  Epics — establish the pattern now, don't over-build screens that don't
  exist yet.

## Definition of Done
- An Admin and a Customer can each register, log in, and log out through
  the **web** app. Native verification isn't required for v1 (see the
  Foundation Epic's platform scope note).
- Requests to admin-only and customer-only endpoints are correctly
  rejected for the wrong role or no auth at all.
- Unit tests cover: password hashing/verification, JWT guard rejection
  logic, and both registration/login endpoints for both account types.
- Session restores correctly on app reload without requiring re-login.
