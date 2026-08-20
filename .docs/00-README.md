# Claude Code Implementation Guide — Tonic 112

This folder contains everything needed to implement the app autonomously,
one Epic at a time, in Claude Code.

## Files in this folder

- `architecture-and-product-spec.md` — the single source of truth for
  product decisions, data model, and architecture. **Read this in full
  before starting Epic 01, and re-read the relevant sections before each
  subsequent Epic.**
- `01` through `10` — Epic instruction files, meant to be fed to Claude Code
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

| #   | Epic                                               | Depends on                      |
| --- | -------------------------------------------------- | ------------------------------- |
| 01  | Foundation — monorepo, Docker Compose, CI skeleton | —                               |
| 02  | Design System & Reusable Component Library         | 01                              |
| 03  | Auth & Accounts                                    | 02                              |
| 04  | Party Creation & Join Flow                         | 03                              |
| 05  | Roles & Bartender Promotion                        | 04                              |
| 06  | Drink & Ingredient Catalog                         | 02 (parallelizable with 03–05)  |
| 07  | Order Lifecycle & Real-Time Claiming               | 05, 06                          |
| 08  | Notifications                                      | 07                              |
| 09  | Internationalization                               | 06 (touches 01–08's UI strings) |
| 10  | Observability, Security & Deployment               | all prior                       |

Epic 02 (Design System) produces no end-user-facing feature on its own —
it's a prerequisite component library that every later Epic's frontend
work is built from. Do not skip it or treat it as optional polish.

Epic 06 (catalog) has no hard dependency on 03–05 and could technically be
built in parallel if you ever wanted to split work — but for a solo,
sequential Claude Code workflow, following the numeric order is simplest.

## Two open decisions already resolved

Earlier drafts of this project left two design questions open. Both are
now fully decided and documented in the architecture spec — Claude Code
does not need to flag these or ask before relying on them:

- Multi-bartender order claiming → first-to-claim wins.
- Customer identity → real registered accounts (with history and
  favorites) alongside fully ephemeral anonymous per-party guests, both
  supported side by side.
