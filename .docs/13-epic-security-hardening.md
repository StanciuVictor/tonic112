# Epic 13 — Security Hardening

## Shared Context

Home-party drink-ordering app. Full details in
`architecture-and-product-spec.md` — read it before starting, especially
Section 11 (Security Hardening).

This Epic assumes Epic 01 (Foundation) is complete for the Docker/VPS
context, but in practice belongs near the end — do it once the app is
close to feature-complete and ready for its first real deployment, and
**before** Epic 14 (Deployment & CI/CD), since the deployment pipeline
assumes the VPS is already hardened.

This Epic gets its own file deliberately: it's explicitly new territory
with zero prior experience going in, and deserves a focused session
rather than sharing attention with unrelated deployment or observability
work.

Before touching `apps/mobile`, check your local skills directory for
anything related to Expo or React Native, and use it if present.

## Goal

The production VPS is hardened against the basic, common attack surface
before it's ever exposed to real guests — SSH access, firewall rules, OS
patching, brute-force protection, and HTTPS.

## Tasks (applied to the production VPS)

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

## Definition of Done
- The production VPS passes a basic security check: SSH password login
  refused, only 80/443 reachable externally, Postgres unreachable from
  outside the Docker network, HTTPS working with a valid certificate.
- A security runbook exists in the repo documenting the hardening steps
  taken, detailed enough to redo from scratch.
