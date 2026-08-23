import { Platform } from 'react-native';

/**
 * Central design-token module. Every component and screen must read colors,
 * spacing, radii, and fonts from here rather than hardcoding literal values,
 * so per-platform variation (v2) stays a contained edit in this one file.
 *
 * Colors are specified in the design as OKLCH but React Native's StyleSheet
 * has no oklch() support, so each value below was converted to sRGB hex
 * using the standard OKLab->linear-sRGB matrices (Björn Ottosson's
 * formulation) followed by sRGB gamma encoding. The source OKLCH value is
 * kept in a comment next to each converted color for traceability back to
 * the approved design.
 */

export const colors = {
  background: '#F8F5EE', // oklch(97% 0.01 90)
  surface: '#FFFFFF',
  text: {
    primary: '#252117', // oklch(25% 0.02 90)
    muted: '#858073', // oklch(60% 0.02 90)
    mutedAlt: '#767165', // oklch(55% 0.02 90)
  },
  accent: {
    coral: '#F75F4C', // oklch(68% 0.19 30)
    teal: '#00B7B0', // oklch(70% 0.13 190)
    yellow: '#EDCC48', // oklch(85% 0.15 95)
  },
} as const;

export type OrderStatus =
  | 'pending'
  | 'claimed'
  | 'preparing'
  | 'ready'
  | 'cancelled';

export const statusColors: Record<
  OrderStatus,
  { background: string; text: string; label: string }
> = {
  pending: {
    background: '#EDCC48', // oklch(85% 0.15 95)
    text: '#693C00', // oklch(40% 0.1 70)
    label: 'New',
  },
  claimed: {
    background: '#FFBD96', // oklch(90% 0.14 40)
    text: '#97271B', // oklch(45% 0.15 30)
    label: 'Claimed',
  },
  preparing: {
    background: '#82EDE6', // oklch(88% 0.1 190)
    text: '#00524E', // oklch(38% 0.1 190)
    label: 'Preparing',
  },
  ready: {
    background: '#9EE1AB', // oklch(85% 0.1 150)
    text: '#00481B', // oklch(35% 0.1 150)
    label: 'Ready',
  },
  cancelled: {
    background: '#DFDEDA', // oklch(90% 0.005 90)
    text: '#565552', // oklch(45% 0.005 90)
    label: 'Cancelled',
  },
};

/**
 * Generic success/error/warning feedback colors (Toast, Input error state).
 * Intentionally reuses the approved status-pill hues (ready/claimed/pending)
 * for visual consistency rather than introducing new colors outside the
 * approved palette.
 */
export const feedback = {
  success: { background: '#9EE1AB', text: '#00481B' },
  error: { background: '#FFBD96', text: '#97271B' },
  warning: { background: '#EDCC48', text: '#693C00' },
} as const;

export const fonts = {
  display: 'Fredoka_600SemiBold',
  displayMedium: 'Fredoka_500Medium',
  body: 'Poppins_400Regular',
  bodyMedium: 'Poppins_500Medium',
  bodySemiBold: 'Poppins_600SemiBold',
  bodyBold: 'Poppins_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

/**
 * Border radii specific to the Button system (per-variant values from the
 * approved button spec, distinct from the generic `radii` scale above).
 */
export const buttonRadii = {
  primary: 18,
  secondary: 18,
  onHeader: 14,
  pill: 20,
  queue: 10,
  icon: 10,
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

/**
 * Card shadow, per spec: `0 4px 14px -6px rgba(0,0,0,0.12)`. React Native's
 * shadow* props have no spread-radius equivalent to the CSS `-6px`, so the
 * blur radius is reduced from 14 to compensate for the missing negative
 * spread and keep the rendered softness close to the CSS reference. Web
 * (react-native-web) translates these shadow* props to a CSS box-shadow
 * automatically; Android has no blur/offset shadow model at all, so
 * `elevation` is supplied there as the closest native equivalent.
 */
export const cardShadow = Platform.select({
  android: { elevation: 4 },
  default: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
});

/**
 * Unselected filter-pill shadow, per spec: `0 2px 8px -4px rgba(0,0,0,.15)`.
 * Same negative-spread compensation approach as `cardShadow` above.
 */
export const pillShadow = Platform.select({
  android: { elevation: 2 },
  default: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
});

/**
 * Button design system — every color, per variant and state, converted from
 * the approved OKLCH spec to sRGB hex using the same OKLab matrices as the
 * rest of this file (see module comment above). This is the single source
 * of truth the `Button` component reads from; no button-related component
 * should hardcode a color literal outside this object.
 *
 * State math (for reference, already baked into the values below):
 *   default -> hover:   lightness -6%,  chroma +0.01
 *   default -> pressed: lightness -12%, plus `transform: scale(0.97)` in the component
 * Hue is never shifted between states, only lightness/chroma, per the approved spec.
 *
 * A few pressed/hover fills at very high lightness + non-trivial chroma (coral
 * and teal tints) fall slightly outside the sRGB gamut; the converter clamps
 * them to the nearest in-gamut sRGB color, same as a browser rendering
 * oklch() on an sRGB display would.
 */
export const buttonTokens = {
  primary: {
    bg: colors.accent.coral, // oklch(68% 0.19 30)
    bgHover: '#E54533', // oklch(62% 0.20 30)
    bgActive: '#CC3526', // oklch(56% 0.19 30)
    bgDisabled: '#F1CEC8', // oklch(88% 0.04 30)
    fg: colors.surface,
    fgDisabled: '#B79E9A', // oklch(72% 0.03 30)
  },
  secondary: {
    border: colors.accent.coral, // oklch(68% 0.19 30)
    borderActive: '#E54533', // oklch(62% 0.20 30)
    borderDisabled: '#DCD7C9', // oklch(88% 0.02 90)
    fg: colors.accent.coral, // oklch(68% 0.19 30)
    fgHover: '#DA4433', // oklch(60% 0.19 30)
    fgActive: '#CC3526', // oklch(56% 0.19 30)
    fgDisabled: '#B0AEA7', // oklch(75% 0.01 90)
    fillHover: '#FFE9E2', // oklch(96% 0.04 30) — out of sRGB gamut, clamped
    fillActive: '#FFD7CD', // oklch(92% 0.06 30) — out of sRGB gamut, clamped
  },
  onHeader: {
    teal: {
      bg: colors.surface,
      bgHover: '#E7F5F4', // oklch(96% 0.015 190)
      bgActive: '#CFEBE9', // oklch(92% 0.03 190)
      bgDisabled: 'rgba(255,255,255,0.35)',
      fg: '#00615D', // oklch(42% 0.13 190) — out of sRGB gamut, clamped
      fgActive: '#005652', // oklch(38% 0.13 190) — out of sRGB gamut, clamped
      fgDisabled: 'rgba(255,255,255,0.75)',
    },
    coral: {
      bg: colors.surface,
      bgHover: '#FFEDEA', // oklch(96% 0.02 30)
      bgActive: '#FEDBD5', // oklch(92% 0.04 30)
      bgDisabled: 'rgba(255,255,255,0.35)',
      fg: '#AF2C1F', // oklch(50% 0.17 30)
      fgActive: '#9E170C', // oklch(45% 0.17 30)
      fgDisabled: 'rgba(255,255,255,0.75)',
    },
  },
  pill: {
    unselected: {
      bg: colors.surface,
      fg: '#4C473C', // oklch(40% 0.02 90)
      bgHover: '#FFE9E2', // oklch(96% 0.04 30) — out of sRGB gamut, clamped
      fgHover: '#AF3E30', // oklch(52% 0.15 30)
      // Pressed previews the *selected* look (bg goes straight to the
      // primary-hover coral, label flips white) — intentional per spec, so
      // selection feels instant under the finger.
      bgActive: '#E54533', // oklch(62% 0.20 30)
      fgActive: colors.surface,
    },
    selected: {
      bg: colors.accent.coral, // oklch(68% 0.19 30)
      bgHover: '#E54533', // oklch(62% 0.20 30)
      bgActive: '#CC3526', // oklch(56% 0.19 30)
      fg: colors.surface,
    },
  },
  queue: {
    // Primary queue action (Claim/Start/Mark Ready) reuses `primary` above
    // at compact size — see buttonRadii.queue / the component's size prop.
    ghostBg: '#F0EEE9', // oklch(95% 0.008 90)
    ghostBgHover: '#E4E1DA', // oklch(91% 0.01 90)
    ghostBgActive: '#D7D4CC', // oklch(87% 0.012 90)
    ghostFg: '#686357', // oklch(50% 0.02 90)
  },
  icon: {
    heartStroke: '#87806C', // oklch(60% 0.03 90)
    heartFilled: colors.accent.coral, // oklch(68% 0.19 30)
    chevronHoverBg: '#EAE8E2', // oklch(93% 0.008 90)
    // Quantity +/- reuses `primary` above (bg/hover/active/disabled).
  },
  link: {
    fg: colors.accent.coral, // oklch(68% 0.19 30)
    fgHover: '#D33D2C', // oklch(58% 0.19 30)
    fgActive: '#BA2D1F', // oklch(52% 0.18 30)
    fgDisabled: '#B0AEA7', // oklch(75% 0.01 90)
  },
  focusRing: colors.accent.coral, // oklch(68% 0.19 30)
  focusRingOnBand: '#FFFFFF',
} as const;
