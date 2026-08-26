import { ComponentProps, ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  buttonRadii,
  buttonTokens,
  colors,
  fonts,
  fontSizes,
  pillShadow,
  spacing,
} from '../theme/tokens';
import { useFocusVisible } from './use-focus-visible';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'onHeader'
  | 'pill'
  | 'queue'
  | 'icon'
  | 'link';
export type ButtonSize = 'default' | 'compact';
export type ButtonBand = 'teal' | 'coral';
export type QueueTone = 'action' | 'cancel';
type IconName = ComponentProps<typeof Ionicons>['name'];

export interface ButtonProps {
  /** Label text. Not used by variant="icon". Sentence-case — never all-caps. */
  children?: ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** 'compact' only changes rendering for variant="queue" and variant="icon". */
  size?: ButtonSize;
  disabled?: boolean;
  /** variant="primary" only: swaps the label for a spinner, holds the button's width. */
  loading?: boolean;
  /** variant="pill": selected/unselected. variant="icon": filled/outline glyph tint. */
  selected?: boolean;
  /** variant="onHeader" only: which header band the button sits on. */
  band?: ButtonBand;
  /** variant="queue" only: the compact primary action vs. the grey ghost Cancel. */
  tone?: QueueTone;
  /** variant="icon" only: the glyph to render. */
  icon?: IconName;
  accessibilityLabel?: string;
  style?: ViewStyle;
  testID?: string;
  /**
   * Forces the hover or pressed visual state without real pointer input.
   * For the style-guide states gallery only — not meant for product screens.
   */
  forceState?: 'hover' | 'pressed';
}

const HIT_SLOP_COMPACT_TEXT = { top: 6, bottom: 6, left: 6, right: 6 };

function iconHitSlop(size: ButtonSize) {
  return size === 'compact'
    ? { top: 7, bottom: 7, left: 7, right: 7 }
    : undefined;
}

interface StateFlags {
  pressed: boolean;
  hovered: boolean;
  disabled: boolean;
  selected: boolean;
  band: ButtonBand;
  tone: QueueTone;
  size: ButtonSize;
}

interface ResolvedColors {
  bg?: string;
  border?: string;
  fg: string;
}

/** Every button color, for every variant and state, read from `buttonTokens`. */
function resolveColors(
  variant: ButtonVariant,
  flags: StateFlags,
): ResolvedColors {
  const { pressed, hovered, disabled, selected, band, tone, size } = flags;
  switch (variant) {
    case 'primary': {
      const t = buttonTokens.primary;
      if (disabled) {
        return { bg: t.bgDisabled, fg: t.fgDisabled };
      }
      if (pressed) {
        return { bg: t.bgActive, fg: t.fg };
      }
      if (hovered) {
        return { bg: t.bgHover, fg: t.fg };
      }
      return { bg: t.bg, fg: t.fg };
    }
    case 'secondary': {
      const t = buttonTokens.secondary;
      if (disabled) {
        return {
          bg: 'transparent',
          border: t.borderDisabled,
          fg: t.fgDisabled,
        };
      }
      if (pressed) {
        return { bg: t.fillActive, border: t.borderActive, fg: t.fgActive };
      }
      if (hovered) {
        return { bg: t.fillHover, border: t.border, fg: t.fgHover };
      }
      return { bg: 'transparent', border: t.border, fg: t.fg };
    }
    case 'onHeader': {
      const t = buttonTokens.onHeader[band];
      if (disabled) {
        return { bg: t.bgDisabled, fg: t.fgDisabled };
      }
      if (pressed) {
        return { bg: t.bgActive, fg: t.fgActive };
      }
      if (hovered) {
        return { bg: t.bgHover, fg: t.fg };
      }
      return { bg: t.bg, fg: t.fg };
    }
    case 'pill': {
      if (selected) {
        const t = buttonTokens.pill.selected;
        if (pressed) {
          return { bg: t.bgActive, fg: t.fg };
        }
        if (hovered) {
          return { bg: t.bgHover, fg: t.fg };
        }
        return { bg: t.bg, fg: t.fg };
      }
      const t = buttonTokens.pill.unselected;
      // Pressed previews the *selected* look — bg jumps straight to the
      // primary-hover coral, label flips white — so selection feels instant.
      if (pressed) {
        return { bg: t.bgActive, fg: t.fgActive };
      }
      if (hovered) {
        return { bg: t.bgHover, fg: t.fgHover };
      }
      return { bg: t.bg, fg: t.fg };
    }
    case 'queue': {
      if (tone === 'cancel') {
        const t = buttonTokens.queue;
        if (disabled) {
          return { bg: t.ghostBg, fg: buttonTokens.secondary.fgDisabled };
        }
        if (pressed) {
          return { bg: t.ghostBgActive, fg: t.ghostFg };
        }
        if (hovered) {
          return { bg: t.ghostBgHover, fg: t.ghostFg };
        }
        return { bg: t.ghostBg, fg: t.ghostFg };
      }
      // 'action' tone reuses the primary variant's colors at compact size.
      const t = buttonTokens.primary;
      if (disabled) {
        return { bg: t.bgDisabled, fg: t.fgDisabled };
      }
      if (pressed) {
        return { bg: t.bgActive, fg: t.fg };
      }
      if (hovered) {
        return { bg: t.bgHover, fg: t.fg };
      }
      return { bg: t.bg, fg: t.fg };
    }
    case 'icon': {
      if (size === 'compact') {
        // Quantity +/-: filled coral square, reuses the primary tokens.
        const t = buttonTokens.primary;
        if (disabled) {
          return { bg: t.bgDisabled, fg: t.fgDisabled };
        }
        if (pressed) {
          return { bg: t.bgActive, fg: t.fg };
        }
        if (hovered) {
          return { bg: t.bgHover, fg: t.fg };
        }
        return { bg: t.bg, fg: t.fg };
      }
      // Default icon button (back chevron / favorite heart): no fill, hover
      // gets a soft circular background. `selected` swaps the glyph tint to
      // the filled/favorited color.
      const t = buttonTokens.icon;
      const fg = disabled
        ? buttonTokens.primary.fgDisabled
        : selected
          ? t.heartFilled
          : t.heartStroke;
      if (hovered && !disabled) {
        return { bg: t.chevronHoverBg, fg };
      }
      return { bg: 'transparent', fg };
    }
    case 'link': {
      const t = buttonTokens.link;
      if (disabled) {
        return { fg: t.fgDisabled };
      }
      if (pressed) {
        return { fg: t.fgActive };
      }
      if (hovered) {
        return { fg: t.fgHover };
      }
      return { fg: t.fg };
    }
  }
}

function pressScaleFor(variant: ButtonVariant, size: ButtonSize) {
  if (variant === 'link') {
    return undefined;
  } // too small to read a transform
  if (variant === 'icon' && size === 'compact') {
    return 0.94;
  } // quantity +/-
  return 0.97;
}

function labelStyleFor(variant: ButtonVariant, selected: boolean) {
  switch (variant) {
    case 'primary':
    case 'secondary':
      return { fontFamily: fonts.bodyBold, fontSize: 15 };
    case 'onHeader':
      return { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs + 1 };
    case 'pill':
      return {
        fontFamily: selected ? fonts.bodySemiBold : fonts.body,
        fontSize: fontSizes.xs + 1,
      };
    case 'queue':
      return { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.xs + 1 };
    case 'link':
      return { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs + 1 };
    default:
      return { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm };
  }
}

function shapeKeyFor(
  variant: ButtonVariant,
  size: ButtonSize,
): keyof typeof shapeStyles {
  if (variant === 'icon') {
    return size === 'compact' ? 'iconCompact' : 'iconDefault';
  }
  return variant;
}

/**
 * Web-only interaction polish that has no React Native equivalent:
 * `:focus-visible` outline, the CSS transition, and cursor affordances.
 * Gated to `Platform.OS === 'web'` — never sent to native, matching the
 * existing `Platform.select` pattern used for `cardShadow` in tokens.ts.
 */
function webInteractionStyle(
  onBand: boolean,
  focusVisible: boolean,
  disabled: boolean,
): ViewStyle {
  return {
    cursor: disabled ? 'not-allowed' : 'pointer',
    transitionProperty: ['background-color', 'transform'],
    transitionDuration: ['140ms', '90ms'],
    transitionTimingFunction: ['ease', 'ease'],
    outlineStyle: focusVisible ? 'solid' : 'none',
    outlineWidth: 2,
    outlineOffset: 2,
    outlineColor: onBand
      ? buttonTokens.focusRingOnBand
      : buttonTokens.focusRing,
  } as ViewStyle;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  selected = false,
  band = 'coral',
  tone = 'action',
  icon,
  accessibilityLabel,
  style,
  testID,
  forceState,
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [measuredWidth, setMeasuredWidth] = useState<number | undefined>();
  const { focusVisible, onFocus, onBlur } = useFocusVisible();

  const isInert = disabled || (loading && variant === 'primary');
  const isIcon = variant === 'icon';
  const isTextCompactHit =
    variant === 'onHeader' ||
    variant === 'pill' ||
    variant === 'queue' ||
    variant === 'link';
  const onBand = variant === 'onHeader';

  const handleLayout = (e: LayoutChangeEvent) => {
    if (variant === 'primary') {
      setMeasuredWidth((w) => w ?? e.nativeEvent.layout.width);
    }
  };

  return (
    <Pressable
      testID={testID}
      onPress={isInert ? undefined : onPress}
      disabled={isInert}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={onFocus}
      onBlur={onBlur}
      onLayout={handleLayout}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{
        disabled: isInert,
        ...(variant === 'pill' ? { selected } : null),
      }}
      hitSlop={
        isIcon
          ? iconHitSlop(size)
          : isTextCompactHit
            ? HIT_SLOP_COMPACT_TEXT
            : undefined
      }
      style={({ pressed }) => {
        const flags: StateFlags = {
          pressed: (forceState === 'pressed' || pressed) && !isInert,
          hovered: (forceState === 'hover' || hovered) && !isInert,
          disabled: isInert,
          selected,
          band,
          tone,
          size,
        };
        const c = resolveColors(variant, flags);
        const scale = pressScaleFor(variant, size);

        return [
          shapeStyles.base,
          shapeStyles[shapeKeyFor(variant, size)],
          variant === 'pill' && !selected ? pillShadow : null,
          {
            backgroundColor: c.bg,
            borderColor: c.border,
            borderWidth: variant === 'secondary' ? 2 : 0,
          },
          flags.pressed && scale ? { transform: [{ scale }] } : null,
          Platform.OS === 'web'
            ? webInteractionStyle(onBand, focusVisible, isInert)
            : null,
          variant === 'primary' && loading && measuredWidth
            ? { width: measuredWidth }
            : null,
          style,
        ];
      }}
    >
      {({ pressed }) => {
        const flags: StateFlags = {
          pressed: (forceState === 'pressed' || pressed) && !isInert,
          hovered: (forceState === 'hover' || hovered) && !isInert,
          disabled: isInert,
          selected,
          band,
          tone,
          size,
        };
        const c = resolveColors(variant, flags);

        if (isIcon) {
          return (
            <Ionicons
              name={icon ?? 'ellipse-outline'}
              size={size === 'compact' ? 16 : 20}
              color={c.fg}
            />
          );
        }
        if (variant === 'primary' && loading) {
          return <ActivityIndicator size="small" color={colors.surface} />;
        }
        return (
          <Text
            // Sentence-case only — never apply textTransform: 'uppercase' here.
            style={[labelStyleFor(variant, selected), { color: c.fg }]}
            pointerEvents={isInert ? 'none' : 'auto'}
          >
            {children}
          </Text>
        );
      }}
    </Pressable>
  );
}

const shapeStyles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    width: '100%',
    borderRadius: buttonRadii.primary,
    padding: spacing.lg,
  },
  secondary: {
    width: '100%',
    borderRadius: buttonRadii.secondary,
    padding: 13,
  },
  onHeader: {
    alignSelf: 'flex-start',
    borderRadius: buttonRadii.onHeader,
    paddingVertical: 11,
    paddingHorizontal: spacing.lg,
  },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    borderRadius: buttonRadii.pill,
    paddingVertical: 9,
    paddingHorizontal: spacing.lg,
  },
  queue: {
    flex: 1,
    borderRadius: buttonRadii.queue,
    padding: 9,
  },
  iconDefault: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  iconCompact: {
    width: 30,
    height: 30,
    borderRadius: buttonRadii.icon,
  },
  link: {
    alignSelf: 'flex-start',
    paddingVertical: 13,
  },
});
