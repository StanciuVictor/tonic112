# Epic 01 — Foundation: Monorepo, Infra & CI Skeleton

## Shared Context

You are implementing a home-party drink-ordering app. A host (Admin) runs
the event; guests browse a fixed menu and submit orders; bartenders manage
orders from a live dashboard. Full product and architecture details live in
`architecture-and-product-spec.md` in this same folder — read it before
starting.

Tech stack: **Nx monorepo**, `apps/api` (NestJS + Prisma + PostgreSQL),
`apps/mobile` (Expo, React Native + Web targets, Expo Router), `libs/
shared-types` (shared TypeScript DTOs). Deployment target is a single
Hetzner VPS running Docker Compose (API + Postgres + nginx).

**Platform scope: v1 ships as a web app only.** No App Store/Play Store
submission, no EAS native build, in v1. Scaffold Expo normally (it
inherently supports iOS/Android/Web from one codebase) — this Epic isn't
about restricting the codebase, it's about what actually gets built and
verified right now. iOS and Android are a planned v2 addition using the
same code; nothing in this Epic or later ones should introduce web-only
assumptions that would block that later.

Before touching `apps/mobile`, check your local skills directory for
anything related to Expo or React Native, and use it if present. No
specific skill name is assumed.

## Goal

Stand up the monorepo skeleton, local Docker Compose environment, and a CI
pipeline — with one working end-to-end slice (a health check) proving the
whole chain works, before any real feature is built.

## Tasks

### Monorepo
- Initialize an Nx workspace with `apps/api`, `apps/mobile`, and
  `libs/shared-types`.
- `libs/shared-types` should export a placeholder DTO to confirm both apps
  can import from it.

### Backend
- Scaffold NestJS in `apps/api`.
- Add Prisma, connect it to PostgreSQL via environment variable
  (`DATABASE_URL`), and commit an initial empty schema (`schema.prisma`)
  ready for later Epics to extend.
- Add a `GET /health` endpoint returning a simple status payload.
- Add `@nestjs/throttler` as a dependency now (configuration comes in Epic
  06) so it's part of the baseline `package.json` from the start.

### Frontend
- Scaffold Expo in `apps/mobile` with Expo Router. The codebase inherently
  supports web, iOS, and Android — don't remove or block the native
  targets — but v1 only needs to actually build and run for **web**.
- Add a single screen that calls `GET /health` (via a shared
  `libs/shared-types` type for the response) and displays the result — this
  is the proof that the full chain (client app → API → response type)
  works end to end.
- Set up TanStack Query and Zustand as the state layer, even though there's
  little to manage yet.

### Docker & Infra
- `docker-compose.yml` (local dev): API container, PostgreSQL container,
  and an nginx container that reverse-proxies to the API and will later
  serve the Expo web static export.
- `docker-compose.prod.yml`: production override (real secrets via env
  vars, `NODE_ENV=production` on the API container). Do not commit real
  secrets — use placeholder env var names.
- nginx config: reverse proxy `/api` and `/socket.io` to the API container;
  serve static files for everything else (the static web build doesn't
  exist yet — configure the location block so it's ready to serve
  `apps/mobile`'s web export once it exists).

### CI
- GitHub Actions workflow (`ci.yml`) triggered on pull requests into
  `main`: install deps, lint, run unit tests, build both apps. This
  workflow must never deploy anything — deployment pipelines are built in
  Epic 10.

## Definition of Done
- `docker compose up` locally brings up API + Postgres + nginx, and hitting
  the app through nginx returns the health check successfully.
- The Expo app, running as a **web** build, successfully displays the
  health check response fetched through the shared DTO type. Verifying a
  native simulator/device target is not required for v1, but nothing in
  the scaffold should make it impossible later.
- CI runs on a PR and passes on a clean checkout.
- No feature-specific code (auth, parties, orders, etc.) exists yet — this
  Epic is scaffolding only.
