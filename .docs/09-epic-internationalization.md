# Epic 09 — Internationalization

## Shared Context

Home-party drink-ordering app. Full details in
`architecture-and-product-spec.md` — read it before starting, especially
Section 9 (Internationalization).

Two supported languages: **English (default) and Romanian.** Two distinct
translation mechanisms are already established by earlier Epics and must
not be conflated:
1. **Static UI chrome** (buttons, labels, status text) — developer-authored
   strings, not yet wired to a translation library.
2. **Dynamic, admin-managed content** (`Ingredient.name`,
   `DrinkIngredient.instructions`) — already stored as bilingual JSON on
   the database rows since Epic 06. `Drink.name` is never translated.

This Epic assumes Epic 06 is complete, and in practice touches UI built in
every prior Epic, since it wires up the static-string layer across the
whole app.

Before touching `apps/mobile`, check your local skills directory for
anything related to Expo or React Native, and use it if present — locale
detection and translation-library setup are a common area for
purpose-built skills to help with.

## Goal

Every static UI string in the app is translated into English and
Romanian, the correct language is detected automatically on first load,
and the user can manually switch languages at any time. Dynamic
ingredient/recipe content (already bilingual in the database since Epic
05) is correctly displayed in the selected language.

## Frontend Tasks

- Add `i18next` + `react-i18next` to `apps/mobile`.
- Create `en.json` and `ro.json` translation files, and extract every
  hardcoded UI string built in Epics 01–08 into them — buttons, labels,
  status text (`pending`, `claimed`, `preparing`, `ready`, `cancelled`),
  error messages, and form labels.
- Use `expo-localization` to detect the device/browser locale on first
  load and set the initial language accordingly, defaulting to English if
  the detected locale isn't supported.
- Add a manual language toggle, accessible from wherever makes sense
  given the app's existing navigation structure, that overrides the
  detected language and persists the choice for the session.
- Update every screen reading `Ingredient.name` or
  `DrinkIngredient.instructions` (built in Epic 06) to read the key
  matching the current selected language (e.g. `ingredient.name[locale]`)
  instead of the hardcoded `.en` fallback used temporarily in Epic 06.
- Confirm `Drink.name` is rendered as-is, untouched by the language
  switch, everywhere it appears.

## Backend Tasks

- None required — the API already returns `Ingredient.name` and
  `DrinkIngredient.instructions` as full bilingual JSON objects (Epic 06);
  language selection is a purely client-side concern. Double check no
  endpoint was accidentally built to pre-select a single language
  server-side.

## Definition of Done
- Switching the manual language toggle updates every static UI string
  across every screen built so far, with no leftover hardcoded English
  text.
- First app load correctly defaults to Romanian on a device/browser set
  to Romanian, and to English otherwise.
- Ingredient names and recipe instructions correctly follow the selected
  language; drink names never change regardless of language.
- No missing-translation-key warnings/fallback-to-raw-key text appears
  anywhere in either language.
