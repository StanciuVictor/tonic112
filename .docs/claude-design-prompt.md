# Claude Design Prompt — 112 & Tonic

This file is meant to be pasted directly into Claude Design, not Claude
Code. Its output (screen mockups/screenshots) is what then gets handed to
Claude Code as visual reference when building each Epic.

If this is going into a fresh Claude Design session that hasn't already
generated the approved palette earlier in this project, paste the whole
thing as-is — all tokens are restated below so it doesn't need prior
context. If it's going into the *same* Claude Design thread that produced
the original palette, you can trim the Color Palette / Typography
sections and just keep the Screens list, since it already has that
context.

**Platform note:** v1 ships as a web app only — no native iOS/Android
build. That doesn't change the visual brief below: guests will overwhelmingly
open it on a phone browser, so every guest-facing screen should still be
designed as a phone-shaped, portrait mockup exactly as described. The one
screen worth a second thought is the **Bartender Dashboard** (#12) — since
it's web, it's plausible a bartender could load it on a tablet or laptop
propped up near the bar rather than only a phone. If you want a wider
layout variant of that one screen generated alongside the phone version,
say so explicitly when you paste this in; the brief below defaults to
phone-shaped for every screen including that one.

---

Generate a complete modern mobile app UI design system and all core
screen designs for a home-party drink-ordering app called "112 & Tonic".

**112 & Tonic** is the app a host uses to run drink orders at a home party.
Guests scan a QR code or enter a code to join, browse a fixed drink menu,
and submit orders from their phones. One or more bartenders manage
incoming orders from a live dashboard. The app helps people:

- Join a specific party via QR code or a short backup code
- Browse a curated, fixed drink menu, filterable by category
- Add drinks to an order and track its status live (New → Claimed →
  Preparing → Ready)
- Save favorite drinks across different parties (for registered guests)
- Manage the party as a bartender — claim orders, update their status
- Manage the drink/ingredient catalog as the host/admin, ahead of a party
- Switch the whole app between English and Romanian

## Design Style

- Warm, playful, casual-party energy — **not** a luxury/editorial
  aesthetic. Think "fun cocktail night with friends," not premium travel
  branding.
- Light mode only — no dark mode needed.
- Soft rounded corners throughout, 18–20px radius on cards.
- Subtle depth via soft floating-card shadows, no visible borders.
- Fully rounded, pill-shaped buttons and filter chips.
- Solid color-block header bands (not gradients) — teal for guest-facing
  screens, coral for bartender-facing screens.
- **No large photography anywhere.** Drinks are represented by small,
  custom, simplified icon illustrations (flat, minimal, consistent line
  weight) or, where an icon doesn't exist yet, a plain colored category
  swatch — never a stock photo.
- Mobile-first, portrait orientation, generous touch targets. No hover
  states or hover-dependent interactions — this is a touch-first app.
- Smooth, confident spacing — not cluttered, not corporate, not generic
  "restaurant ordering kiosk" style.

## Color Palette (OKLCH)

- Background: `oklch(97% 0.01 90)` — warm cream white
- Surface/cards: `white`
- Text primary: `oklch(25% 0.02 90)`
- Text muted: `oklch(60% 0.02 90)`
- Accent 1 (coral, primary CTA / brand / bartender header): `oklch(68% 0.19 30)`
- Accent 2 (teal, guest header / secondary): `oklch(70% 0.13 190)`
- Accent 3 (yellow, tags/highlights): `oklch(85% 0.15 95)`

**Order status pill colors** (five distinct states — this matters, don't
collapse any of them):
- New/Pending: bg `oklch(85% 0.15 95)` / text `oklch(40% 0.1 70)` (yellow)
- Claimed: bg `oklch(90% 0.14 40)` / text `oklch(45% 0.15 30)` (coral-tinted)
- Preparing: bg `oklch(88% 0.1 190)` / text `oklch(38% 0.1 190)` (teal)
- Ready: bg `oklch(85% 0.1 150)` / text `oklch(35% 0.1 150)` (green)
- Cancelled: bg `oklch(90% 0.005 90)` / text `oklch(45% 0.005 90)` (grey)

## Typography

- Display/headers: Fredoka, weight 500–600 — rounded, playful
- Body/UI: Poppins, weight 400–700
- Strong hierarchy: bold party/section headers, medium subheads,
  comfortable readable body text
- Prominent metadata pills for things like drink category ("Cocktail",
  "Mocktail", "Shot") and order status

## Screens

1. **Splash Screen** — app name/logo centered on the cream background,
   minimal, no imagery, quick.

2. **Party Join Landing** — the page a QR scan opens directly in the
   browser (v1 is web-only — no "open in app" handoff or store fallback
   needed). Shows the party name/code being joined and a way to enter the
   backup code manually as an alternative to scanning. Minimal,
   reassuring, no clutter.

3. **Identify Screen** — after a valid code/QR is confirmed: two clear
   pill-button choices, "Log In" and "Continue as Guest" (with a
   name-entry field for the guest path). No role selector anywhere on
   this screen.

4. **Login / Register Screens** — email + password fields, rounded
   inputs, coral primary CTA, clean single-column layout.

5. **Create Party Screen (Admin)** — large centered QR code, the
   human-readable backup code displayed prominently beneath it, "Start
   Party" pill CTA.

6. **Menu / Explore Screen (Guest)** — teal header band showing the party
   name; a horizontal, single-select category filter chip row ("All" +
   one chip per drink category) directly below the header; a scrollable
   list of drink cards below that, each showing a small drink icon (or
   category-color swatch as fallback), drink name, a couple of ingredient
   tags, a favorite heart icon, and an add button; a sticky "View Order"
   bar pinned to the bottom showing the current item count.

7. **Drink Detail Screen** — larger version of the drink's icon, full
   ingredient list, ordered recipe steps, "Add to Order" pill CTA,
   favorite toggle.

8. **Review Order / Cart Screen** — list of currently selected drinks
   with quantity controls, a clear total item count, and a "Submit Order"
   pill CTA (shown disabled/loading while the submission is in flight).

9. **My Orders / Order Status Screen (Guest)** — a list of the guest's
   own submitted orders, each as a card showing the drink, a status pill
   in one of the five colors above, and cancel/edit actions that only
   appear while the order is still eligible (New or Claimed).

10. **Favorites Screen (registered customers only)** — a grid or list of
    starred drinks, using the same drink-card style as the menu.

11. **Participants Screen** — list of everyone currently in the party,
    each with a small role tag (Bartender / Guest); a "Promote to
    Bartender" pill action next to eligible logged-in participants,
    visible only to current bartenders/the admin.

12. **Bartender Dashboard Screen** — coral header band with a small live
    "active" indicator; a chronological queue of order cards below, each
    showing the guest's name, time submitted, a status pill, the drink
    and its ingredients, and action buttons (Claim / Advance Status)
    sized for quick tapping during a busy moment.

13. **Admin — Manage Drinks Screen** — list of drinks with their icon
    thumbnail and category tag; an add/edit form with name, category
    picker (pill chips), and a link into the recipe builder.

14. **Admin — Manage Ingredients Screen** — list/add/edit ingredients,
    each with side-by-side English and Romanian name fields and a unit
    field.

15. **Admin — Recipe Builder Screen** — attach ingredients to a drink
    with quantities, plus step-by-step instructions entered in both
    English and Romanian.

16. **Profile / Settings Screen** — avatar and name, a short order-history
    list, a language toggle (EN/RO, styled as a small pill switch), and a
    logout action.

17. **Push Notification Permission Prompt** — a friendly modal shown
    right after joining a party, explaining it's just for "your drink is
    ready" alerts — not a generic system permission dialog with no
    context.

18. **Empty / Error States** — styled consistently with the rest of the
    system: an invalid-or-ended party code screen, a camera-permission-
    denied fallback prompting the backup code input, and a "no favorites
    yet" empty state.

## Direction

Design this like a real, polished consumer app that a small startup would
actually ship — not a generic admin/ordering-kiosk template. Every screen
should feel connected through the one cohesive system above: same header
treatment, same card style, same pill buttons, same icon language. The
experience should feel warm, fun, a little playful, and effortless on a
phone in someone's hand at a party — never corporate, never cluttered,
never photography-heavy. Generate high-quality mobile mockups in a phone
frame with realistic spacing and production-ready polish.
