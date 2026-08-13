# Epic 02 — Design System & Reusable Component Library

## Shared Context

Home-party drink-ordering app. Full product and architecture details live
in `architecture-and-product-spec.md` in this same folder.

This Epic assumes Epic 01 (Foundation) is complete — the Nx monorepo,
Expo app shell, and Docker Compose environment already exist. It produces
**no end-user-facing feature** — no login, no orders, nothing a party
guest would ever see on its own. Its output is a small library of styled,
reusable components that every subsequent Epic's frontend work is built
from. Do not proceed to Epic 03 until this library exists and is visibly
demonstrated (e.g. a temporary style-guide screen — see Definition of
Done).

Check your local skills directory for anything related to Expo, React
Native, or mobile UI/design conventions before starting, and use it if
present — this Epic is entirely frontend styling work.

## Why this Epic exists

Without a shared component library built first, every later Epic would
make its own one-off styling decisions, and visual consistency would have
to be retrofitted across the whole app later. This Epic exists specifically
to prevent that. Every screen built from Epic 03 onward must compose from
the components defined here rather than writing new ad hoc styles.

## Platform approach: unified, and it ships on web first

**v1 ships as a web app only** (Section 6 of the architecture spec) — but
this component library is still built platform-agnostic from day one, not
web-specific, because iOS and Android are a planned v2 addition using
this exact same library. The visual design itself is **one consistent
system across iOS, Android, and Web** — not iOS Human Interface
Guidelines conventions on iPhone and Material Design conventions on
Android. This is fully supported: every component in this system is
custom-drawn (custom-styled `View`/`Text`/`Pressable` compositions), not
native OS controls like the default `Switch` or `Picker`. This is also
the only way to achieve the approved visual system at all — literal
native controls render in generic OS-default styling and cannot reproduce
brand-specific shapes/colors like the coral pill buttons or rounded
shadowed cards. Do not substitute a literal native `Button`/`Switch`/etc.
anywhere in place of these components, even for a single screen, and
don't write anything that only compiles for web — the same components
need to work unmodified when native builds are added in v2.

### Build for cheap v2 evolution: centralize everything in a theme file

Two things happen in v2 that this Epic should make cheap rather than
expensive: **adding iOS/Android as build targets**, and, optionally,
**per-OS native-feeling conventions** (platform-specific shadow softness,
corner radius, animation easing, or swapping in a literal native `Switch`
for a couple of specific interactive elements) on top of that. To keep
both cheap, **do not hardcode colors,
spacing, radii, or fonts inline inside individual components or screens.**
Define them once in a single central theme/token module (e.g.
`apps/mobile/theme/tokens.ts`), and have every component in this library
— and every screen built in later Epics — reference that module rather
than repeating literal values. Done this way, adding per-platform
variation later is a contained edit inside the theme module and a handful
of shared components (e.g. wrapping a value in `Platform.select({ ios:
..., android: ... })`), not a hunt-and-replace across the whole app. Every
call site that already uses `<Button>` or `<Card>` continues to work
unchanged.

## Design Tokens

These values come directly from an approved visual design produced in
Claude Design and must be used as-is, not reinterpreted or approximated.

### Color palette (OKLCH)

| Token | Value | Usage |
|---|---|---|
| `background` | `oklch(97% 0.01 90)` | Screen background — warm cream white |
| `surface` | `white` | Cards and elevated surfaces |
| `text.primary` | `oklch(25% 0.02 90)` | Primary text |
| `text.muted` | `oklch(60% 0.02 90)` | Secondary/muted text |
| `text.mutedAlt` | `oklch(55% 0.02 90)` | Slightly darker muted text variant |
| `accent.coral` | `oklch(68% 0.19 30)` | Primary CTA / brand accent |
| `accent.teal` | `oklch(70% 0.13 190)` | Headers / secondary accent |
| `accent.yellow` | `oklch(85% 0.15 95)` | Tags / highlights |

### Status pill colors

The app's order lifecycle (Section 3/4 of the architecture spec) has five
states: `pending → claimed → preparing → ready`, plus `cancelled`. Each has
an approved, final color — `claimed` intentionally ties into the coral
brand accent rather than an arbitrary color, since it's the state where a
bartender has taken personal ownership of the order.

| Status | Background | Text |
|---|---|---|
| `pending` ("New") | `oklch(85% 0.15 95)` (yellow) | `oklch(40% 0.1 70)` |
| `claimed` | `oklch(90% 0.14 40)` (coral/orange — ties to `accent.coral`) | `oklch(45% 0.15 30)` |
| `preparing` | `oklch(88% 0.1 190)` (teal) | `oklch(38% 0.1 190)` |
| `ready` | `oklch(85% 0.1 150)` (green) | `oklch(35% 0.1 150)` |
| `cancelled` | `oklch(90% 0.005 90)` (neutral grey) | `oklch(45% 0.005 90)` |

### Typography

- **Display/headers**: Fredoka, weight 500–600
- **Body/UI**: Poppins, weight 400–700
- Load both via Expo's font-loading mechanism (confirm the current
  recommended package/method against Expo's docs at implementation time
  rather than assuming a specific package name — this detail changes
  across Expo SDK versions).

### Shape & surface language

- Cards: `surface` (white) background, large radius (18–20px), soft shadow
  (`0 4px 14px -6px rgba(0,0,0,0.12)`), no visible border.
- Header bands: solid color block (not a gradient) — teal for
  guest-facing screens, coral for bartender-facing screens.
- Buttons and chips: fully rounded (pill-shaped). Primary action buttons
  use the coral accent.
- Category swatches: circular or rounded-square color chips representing
  a drink's category — used instead of photos (see Epic 06).

## Component Library to Build

Build these as reusable, documented components in a shared location (e.g.
`apps/mobile` under a `components/` or `ui/` directory), each accepting
props rather than being hardcoded per screen:

- **Button** — primary (coral, pill), secondary, and disabled variants.
  Disabled state must be visually distinct (reduced opacity is the
  simplest default) — this matters more than any hover state, since the
  app is touch-first (see below).
- **Card** — the white/rounded/shadow container used throughout.
- **StatusPill** — one component parameterized by the five order statuses
  above, not five separate components.
- **FilterChip** — used for the category filter row (Epic 06); supports a
  selected/unselected visual state.
- **DrinkIcon** — displays a drink's custom-generated icon image (see
  Epic 06 — `Drink.imageUrl`, now actively used to store a
  Claude-Design-generated stylized icon per drink) when one exists;
  falls back to **CategorySwatch** below when it doesn't, so the catalog
  is fully usable before every drink has a finished icon.
- **CategorySwatch** — the colored circular/rounded-square chip per drink
  category, used both standalone (in the filter chips) and as the
  fallback inside `DrinkIcon`.
- **HeaderBand** — the solid-color header block, parameterized by which
  accent color to use (teal vs. coral).
- **Input** — text input styled to match the system, including a visible
  error state (for form validation across login, registration, catalog
  management, etc.).
- **Toast/inline feedback** — a lightweight way to show success/error/
  warning feedback after an action (e.g. "Order submitted", "Promotion
  failed") — exact mechanism (inline banner vs. toast) is an
  implementation choice, but it must exist and be reused rather than
  rebuilt ad hoc per screen.

### On interaction states — what actually matters here

Do not spend effort designing **hover states** — this is a touch-first
app; hover is largely irrelevant outside the secondary web target and
isn't worth dedicated design time. Focus instead on: **pressed/active**
(a visible feedback state on tap — e.g. a slight opacity or scale change),
**disabled**, **error**, and the domain-specific **status pill** colors
above. Those are the states that actually matter across touch and web.

## Definition of Done

- A temporary style-guide/showcase screen exists (not part of the final
  app navigation — remove or hide it once no longer needed) displaying
  every component above in all of its states, so the full system can be
  visually reviewed in one place before any real screen is built on top
  of it.
- Fredoka and Poppins render correctly on the **web** build. Native
  verification isn't required for v1 (see Platform approach above), but
  use Expo's standard cross-platform font-loading mechanism rather than
  a web-only approach, so it continues working unmodified once native
  builds are added.
- All colors match the OKLCH values specified above exactly (or, if the
  target styling system doesn't support OKLCH directly, an accurately
  converted equivalent — document the conversion method used).
- All shared values (color, spacing, radius, font) are pulled from a
  single central theme/token module — no component or screen hardcodes
  these inline. This is what keeps a future move toward per-OS native
  conventions a contained change rather than an app-wide rewrite.
- No screen built in any later Epic introduces new one-off button, card,
  or pill styling — everything composes from this library.
