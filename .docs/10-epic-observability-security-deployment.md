# Epic 10 — Observability, Security & Deployment

## Shared Context

Home-party drink-ordering app. Full details in
`architecture-and-product-spec.md` — read it before starting, especially
Section 10 (Observability), Section 11 (Security Hardening), and Section
12 (Deployment & Infrastructure).

This is the final Epic. It assumes every prior Epic is complete and the
app is feature-complete for v1. This Epic makes it observable, secure, and
actually deployable to production — none of that has been built yet.

Before touching `apps/mobile`, check your local skills directory for
anything related to Expo or React Native, and use it if present.

## Goal

The app reports analytics and errors to PostHog from both the API and the
client; the production VPS is hardened per the architecture spec's
checklist; and two manually-triggered GitHub Actions pipelines exist to
bring the production stack up and down independently of code merges.

## Observability Tasks

- Add the PostHog SDK to `apps/api` (server-side event capture and
  exception tracking) and `apps/mobile` (client-side event capture and
  exception tracking). Use PostHog Cloud, free tier — no self-hosting.
- Capture, at minimum: party created, party joined (customer vs. guest),
  order created, order claimed, order reached `ready`, and unhandled
  exceptions on both the client and server.
- Do not build or integrate a separate error-tracking tool (e.g. Sentry) —
  PostHog's free tier covers analytics, error tracking, and log ingestion
  in one place, per Section 10 of the architecture spec.

## Security Tasks (applied to the production VPS)

- SSH: key-only authentication, password login disabled.
- Firewall (UFW): only ports 80 and 443 open publicly. Confirm PostgreSQL
  is not reachable from outside the Docker network — it should only be
  addressable by other containers, never published to the host's public
  interface.
- `unattended-upgrades` configured for automatic OS security patching.
- `fail2ban` configured on SSH.
- HTTPS via Let's Encrypt/Certbot, terminated at the nginx layer (nginx
  already exists from Epic 01 — extend its config for TLS rather than
  introducing a second proxy layer).
- Document the exact steps taken (as a short runbook in this repo) since
  this is new territory being learned, not just executed — the runbook
  should be detailed enough to redo from scratch if the VPS is ever
  rebuilt.

## Deployment Tasks

- Finalize `docker-compose.prod.yml` (started in Epic 01) with real
  service wiring for API + Postgres + nginx together.
- Two GitHub Actions workflows, both `workflow_dispatch` (manually
  triggered only — merging to `main` must never trigger either of these):
  - **`deploy-live.yml`**: SSHes into the VPS and runs
    `docker compose up -d`.
  - **`deploy-stop.yml`**: SSHes into the VPS and runs
    `docker compose down`.
  - Both should assume the VPS is already provisioned and the repo/images
    are already present/pulled — this Epic is about the on/off switch, not
    initial server provisioning (do that manually once, following the
    security runbook above).
- Confirm the existing `ci.yml` (Epic 01) still only lints/tests/builds on
  pull requests and has no deploy step — the separation between "code
  merged" and "app publicly live" must remain absolute.
- Confirm the Postgres data volume is defined so that running
  `docker compose down` and later `docker compose up -d` again does not
  lose any data.

## Definition of Done
- PostHog receives events from both a live client session and a real API
  request, visible in the PostHog dashboard.
- An unhandled exception on both the client and server is confirmed to
  appear in PostHog's error tracking.
- The production VPS passes a basic security check: SSH password login
  refused, only 80/443 reachable externally, Postgres unreachable from
  outside the Docker network, HTTPS working with a valid certificate.
- Triggering `deploy-live.yml` brings the full stack up and the app is
  reachable over HTTPS; triggering `deploy-stop.yml` takes it down;
  triggering `deploy-live.yml` again afterward restores it with all prior
  data intact.
- A security runbook exists in the repo documenting the hardening steps
  taken.
