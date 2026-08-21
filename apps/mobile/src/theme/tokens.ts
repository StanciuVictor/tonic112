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
