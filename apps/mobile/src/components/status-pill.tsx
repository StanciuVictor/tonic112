import { StyleSheet, Text, View } from 'react-native';
import { fonts, fontSizes, OrderStatus, radii, spacing, statusColors } from '../theme/tokens';

export interface StatusPillProps {
  status: OrderStatus;
}

export function StatusPill({ status }: StatusPillProps) {
  const { background, text, label } = statusColors[status];

  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
  },
});
