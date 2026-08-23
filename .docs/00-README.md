# Claude Code Implementation Guide — Tonic112

This folder contains everything needed to implement the app autonomously,
one Epic at a time, in Claude Code.

## Files in this folder

- `architecture-and-product-spec.md` — the single source of truth for
  product decisions, data model, and architecture. **Read this in full
  before starting Epic 01, and re-read the relevant sections before each
  subsequent Epic.**
- `01` through `14` — Epic instruction files, meant to be fed to Claude Code
  **one at a time, in order.**

## Platform scope

**v1 ships as a web app only.** No App Store or Play Store submission, no
native builds. Every role — customer, guest, and bartender/admin — uses
the web build. The codebase and component library are still built
platform-agnostic from the start (Epic 02), specifically so that adding
iOS and Android as build targets in v2 is a matter of compiling with EAS
Build, not restructuring the app.

## How to use these files

1. Start a Claude Code session in the repo root.
2. Provide `architecture-and-product-spec.md` alongside the Epic file for
   that session.
3. Let Claude Code complete the entire Epic — implementation, tests, and
   the Definition of Done at the bottom of the file — before moving to the
   next one.
4. Each Epic file is self-contained: it restates the shared context it
   needs, so it works correctly even in a fresh session with no memory of
   prior Epics. You do not need to keep a single long-running session going
   for the whole project.
5. Where an Epic touches the mobile/web app, it opens by instructing Claude
   Code to check its own local skills directory for anything Expo or React
   Native-related and use it if present. No specific skill name is assumed
   or required.

## Execution order & why

Every Epic is a **vertical slice**: backend contract first, then the
frontend screens that consume it, so nothing is mocked and nothing gets
rebuilt later. Epics are ordered by dependency — each one only assumes
what earlier Epics have already delivered.

| #   | Epic                                                | Depends on                         |
| --- | --------------------------------------------------- | ---------------------------------- |
| 01  | Foundation — monorepo, Docker Compose, CI skeleton  | —                                  |
| 02  | Design System & Reusable Component Library          | 01                                 |
| 03  | Auth & Accounts                                     | 02                                 |
| 04  | Party Creation & Join Flow                          | 03                                 |
| 05  | Roles & Bartender Promotion                         | 04                                 |
| 06  | Drink & Ingredient Catalog                          | 02 (parallelizable with 03–05)     |
| 07  | Order Data Model & Claiming Logic (backend)         | 05, 06                             |
| 08  | Order Real-Time UI & Bartender Dashboard (frontend) | 07                                 |
| 09  | Favorites                                           | 03, 06 (parallelizable with 07–08) |
| 10  | Notifications                                       | 07, 08                             |
| 11  | Internationalization                                | 06 (touches 01–10's UI strings)    |
| 12  | Observability & Analytics                           | 01–11                              |
| 13  | Security Hardening                                  | 01 (do near the end, before 14)    |
| 14  | Deployment & CI/CD                                  | 13, and functionally all prior     |

Epic 02 (Design System) produces no end-user-facing feature on its own —
it's a prerequisite component library that every later Epic's frontend
work is built from. Do not skip it or treat it as optional polish.

**Epic 07 is deliberately backend-only and split from Epic 08 on
purpose.** Order claiming is the single most concurrency-sensitive piece
of this app — Epic 07's Definition of Done requires a passing test
proving two simultaneous claim attempts can't both succeed. Don't start
Epic 08's dashboard UI until that test is green.

Epics 06 and 09 have no hard dependency on the roles/party-join chain and
could technically be built in parallel if you ever wanted to split work —
but for a solo, sequential Claude Code workflow, following the numeric
order is simplest.

**Epics 12–14 were originally one combined Epic**, split into three so
each gets a focused session: analytics, then security (genuinely new
territory, worth its own undivided attention), then the deploy pipelines
that assume the server is already hardened.

## Two open decisions already resolved

Earlier drafts of this project left two design questions open. Both are
now fully decided and documented in the architecture spec — Claude Code
does not need to flag these or ask before relying on them:

- Multi-bartender order claiming → first-to-claim wins.
- Customer identity → real registered accounts (with history and
  favorites) alongside fully ephemeral anonymous per-party guests, both
  supported side by side.
