# Epic 06 — Drink & Ingredient Catalog

## Shared Context

Home-party drink-ordering app. Full details in
`architecture-and-product-spec.md` — read it before starting, especially
Section 4 (Data Model, `Drink`/`Ingredient`/`DrinkIngredient`) and Section
9 (Internationalization).

This Epic only requires Epic 01 (Foundation) and Epic 03 (Auth &
Accounts, for the Admin-only guard) to be complete. It does not depend on
Epics 04 or 05 and can be built in parallel with them if you're ever
splitting work — for a solo sequential build, following the numeric Epic
order is simplest.

Before touching `apps/mobile`, check your local skills directory for
anything related to Expo or React Native, and use it if present.

## Goal

The Admin can manage a global, fixed drink menu — drinks, ingredients, and
recipes — with ingredient names and recipe instructions stored as
bilingual data (English/Romanian) from the start, even though the
language-switching UI itself is built in Epic 09. Any participant can
browse the menu.

## Backend Tasks

- Add to the Prisma schema:
  - `Drink`: `id, name (plain string, never translated), description,
    category (enum), imageUrl (optional), active`.
  - `imageUrl` stores a custom, stylized icon generated per drink (via
    Claude Design, from a reference photo) — not a photo itself. It's
    nullable: a drink without a generated icon yet must still work
    correctly, falling back to its category swatch in the UI (see
    Frontend Tasks).
  - `category` is a **fixed enum**, not a bilingual JSON field like
    `Ingredient.name` — it's a small, developer-defined taxonomy (e.g.
    `cocktail`, `mocktail`, `shot`, `beer`, `wine`, `non_alcoholic`), so it
    translates through the same static UI-string mechanism as buttons and
    labels (Epic 09), not through per-row bilingual data. Confirm the
    actual category list with the product owner before finalizing the
    enum — the list above is a reasonable default, not a firm spec.
  - `Ingredient`: `id, name (JSON: { en, ro }), unit`. (`currentStock` is a
    v2 field — do not add it now; see Section 16 of the architecture
    spec.)
  - `DrinkIngredient`: `drinkId, ingredientId, quantity, instructions
    (JSON: { en, ro })` — recipe steps for that ingredient within that
    drink's recipe.
- Admin-only CRUD endpoints for `Drink` and `Ingredient`
  (`POST/PATCH/DELETE /admin/drinks`, `/admin/ingredients`), and for
  managing a drink's recipe (`POST/PATCH/DELETE
  /admin/drinks/:id/ingredients`).
- Public (any authenticated participant — customer or guest) read
  endpoints: `GET /drinks` (menu list) and `GET /drinks/:id` (detail,
  including its full recipe with translated ingredient names and
  instructions).
- Validation: `Ingredient.name` and `DrinkIngredient.instructions` must
  always contain both `en` and `ro` keys — reject writes missing either,
  so the catalog can never end up half-translated.

## Frontend Tasks

- **Admin catalog management screens**: list/create/edit/delete drinks
  (including assigning a `category`); list/create/edit/delete ingredients
  (with both language fields required in the form); manage a drink's
  recipe (attach ingredients with quantities and per-step instructions in
  both languages).
- **Customer-facing menu browsing**, following the established visual
  design (Design System Epic, 02):
  - A **category filter chip row** at the top of the screen, one chip per
    `category` value plus an "All" chip selected by default. Single-select
    — choosing a category replaces the current filter rather than adding
    to it.
  - A scrollable list of drink cards below the filter row, each showing
    the drink's **`DrinkIcon`** component (Design System Epic, 02) — the
    generated per-drink icon when `imageUrl` is set, falling back to a
    plain category swatch when it isn't. Never assume every drink has a
    finished icon.
  - A drink detail view showing the recipe. Since Epic 09 (i18n) hasn't
    been built yet, it's fine to render the `en` value of translated
    fields for now — just make sure the UI reads from the JSON structure
    (`ingredient.name.en`) rather than assuming a flat string, so Epic 09
    only has to swap the locale key, not restructure any component.
  - Use the reusable components from the Design System Epic (Card,
    FilterChip, DrinkIcon, CategorySwatch) rather than building one-off
    styling here.

## Definition of Done
- Admin can fully manage the drink and ingredient catalog, including
  multi-ingredient recipes with per-step instructions, through the app.
- Attempting to save an ingredient or instruction missing either language
  is rejected with a clear validation error.
- Any logged-in customer or anonymous guest can browse the menu and view
  a drink's full recipe.
- `Drink.name` is confirmed to never go through any translation
  mechanism, anywhere in the stack.
- Unit tests cover: bilingual validation on ingredient/instruction writes,
  Admin-only enforcement on catalog write endpoints, and correct
  recipe-to-drink relationship data on read.
