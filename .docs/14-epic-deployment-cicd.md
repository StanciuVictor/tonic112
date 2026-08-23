# Epic 14 — Deployment & CI/CD

## Shared Context

Home-party drink-ordering app. Full details in
`architecture-and-product-spec.md` — read it before starting, especially
Section 12 (Deployment & Infrastructure).

This is the final Epic. It assumes Epic 13 (Security Hardening) is
complete — the VPS is already hardened — and that every feature Epic
(01–11) is done, since this is the actual go-live step.

Before touching `apps/mobile`, check your local skills directory for
anything related to Expo or React Native, and use it if present.

## Goal

Two manually-triggered GitHub Actions pipelines exist to bring the
production stack up and down independently of code merges, and merging
to `main` never makes the app publicly live by itself.

## Tasks

- Finalize `docker-compose.prod.yml` (started in Epic 01) with real
  service wiring for API + Postgres + nginx together.
- Two GitHub Actions workflows, both `workflow_dispatch` (manually
  triggered only — merging to `main` must never trigger either of these):
  - **`deploy-live.yml`**: SSHes into the VPS and runs
    `docker compose up -d`.
  - **`deploy-stop.yml`**: SSHes into the VPS and runs
    `docker compose down`.
  - Both should assume the VPS is already provisioned and hardened (Epic
    13) and the repo/images are already present/pulled — this Epic is
    about the on/off switch, not initial server provisioning.
- Confirm the existing `ci.yml` (Epic 01) still only lints/tests/builds on
  pull requests and has no deploy step — the separation between "code
  merged" and "app publicly live" must remain absolute.
- Confirm the Postgres data volume is defined so that running
  `docker compose down` and later `docker compose up -d` again does not
  lose any data.

## Definition of Done
- Triggering `deploy-live.yml` brings the full stack up and the app is
  reachable over HTTPS; triggering `deploy-stop.yml` takes it down;
  triggering `deploy-live.yml` again afterward restores it with all prior
  data intact.
- `ci.yml` is confirmed to have no deploy step of any kind.
