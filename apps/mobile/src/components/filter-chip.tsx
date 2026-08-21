import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, fontSizes, radii, spacing } from '../theme/tokens';

export interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function FilterChip({
  label,
  selected = false,
  onPress,
}: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          selected ? styles.selectedLabel : styles.unselectedLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  selected: {
    backgroundColor: colors.accent.coral,
    borderWidth: 1,
    borderColor: colors.accent.coral,
  },
  unselected: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.text.mutedAlt,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
  },
  selectedLabel: {
    color: colors.surface,
  },
  unselectedLabel: {
    color: colors.text.primary,
  },
});
