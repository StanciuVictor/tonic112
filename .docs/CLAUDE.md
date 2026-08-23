# Tonic112 — Claude Code Project Memory

This file is loaded automatically by Claude Code at the start of every
session in this repo. It's not read by Claude.ai or by the planning
documents in `docs/` — those are separate systems. This file exists
specifically so the following instructions don't need to be re-explained
every session.

**All project-specific context, decisions, and status updates for this
repo belong in this file from now on** — not in Claude's external/cross-
session memory system. If something worth remembering comes up in a
session (a scope decision, a status change, a gotcha), add it here
directly rather than relying on memory outside the repo.

## Do not build these yet — v2 only

The following are deliberately out of scope for v1. If a task seems to
call for one of these, stop and flag it rather than building it — v1 is
intentionally simpler by design in each case, not by oversight:

- **Two-phase party lifecycle.** `Party` has no `draft` status and no
  "Start Party" gating step in v1 — creation is immediately active. Do
  not add a draft/pending party state or block joins on an unstarted
  party.
- **Native iOS/Android builds.** v1 ships as a web app only. Do not run
  EAS Build, do not add App Store/Play Store submission config, and do
  not build installed-app-only flows (custom URL scheme handoff, in-app
  camera QR scanning, Universal Links/App Links). The codebase should
  stay structurally capable of adding native targets later, but nothing
  should require them now.
- **Expo Push notifications.** Web Push only in v1 — there's no installed
  native app to register a push token for yet.
- **Ingredient stock tracking.** The catalog has no stock/quantity
  concept in v1. Don't add stock fields, depletion logic, or
  availability toggling based on stock.
- **OAuth / magic-link login.** Email + password only. Don't add Google/
  Apple sign-in or passwordless login flows.
- **Refresh tokens.** Epic 03 ships a single long-lived JWT — no refresh
  endpoint, no rotation/revocation. This is sanctioned by the Epic 03 doc
  itself for a solo-maintained app that's only live a few hours at a
  time. Don't build refresh-token machinery now; revisit post-launch
  (after Epic 14) if asked to circle back.

- **A staging environment.** Only local dev and production exist.
- **Payment/pricing enforcement.** `Drink.price` may exist in the schema
  but nothing should charge, validate, or enforce a budget against it.

## Current status (keep this updated as Epics complete)

- Epic 01 (Foundation) and Epic 02 (Design System) are implemented,
  locally verified, and committed. Epic 03 (Auth & Accounts) is next.
- The project folder was renamed `bar-app` → `tonic112` between Epic 01
  and Epic 02; Docker Compose's project name is pinned via `name:` in
  `docker-compose.yml` so a future rename can't silently change
  volume/container names again.
- The product itself was renamed "112 & Tonic" → "Tonic 112" mid-Epic-01
  — don't reintroduce the old name.
- No GitHub remote is configured yet, so the CI workflow (`nx affected`)
  has only been verified locally via equivalent `nx` commands, never
  actually run on GitHub Actions.

## Deploy safety (Epic 14)

Epic 14's "Go Live" deploy workflow (SSH + `docker compose up -d` on the
VPS) must never be able to run with just the base `docker-compose.yml` in
production — that silently means dev Postgres credentials and
`NODE_ENV: development` in prod. Either bake the full two-file command
into the deploy script (`docker compose -f docker-compose.yml -f
docker-compose.prod.yml up -d`), or better, set
`COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml` as a persistent
env var on the VPS so a bare `docker compose up -d` always means prod —
that removes the "forgot the flag" failure mode entirely.

## Project conventions

- Full product/architecture context lives in `docs/architecture-and-
product-spec.md` — read it before starting any Epic if it's not already
  in context.
- Work through `docs/01-...` through `docs/14-...` strictly in numeric
  order, one Epic fully completed (including its Definition of Done and
  tests) per session. Each Epic file is self-contained per `00-README.md` — it restates the
  context it needs, so it works correctly even in a fresh session with no
  memory of prior Epics.

- Don't reinvent components already in the shared library from Epic 02 —
  extend them in place if a later Epic needs to add to one (this has
  already happened once, in Epic 04, which added a QR/code icon to the
  shared `HeaderBand` component).

## Working with this developer

- Prefers Git Bash over PowerShell for terminal work.
- Professional dev (NestJS/TypeORM background at their day job) but new
  to specifics of this stack: Nx conventions (targets vs. npm scripts,
  `nx affected` vs `run-many`), Docker/Compose, Expo Router's file-based
  routing. Explain the "why," not just the "what," for infra/tooling
  decisions.
- Explain reasoning before consequential actions (edits, installs,
  structural changes) in a few sentences, then act — don't pad with
  redundant exploratory/echo-style checks once the reasoning is clear.
- If told to stop, stop fully and wait for new explicit direction before
  retrying anything, even a similar action.
- For small/medium changes (a few lines, a config tweak, a one-file
  edit), describe the exact change and let them apply it themselves
  rather than editing directly.
