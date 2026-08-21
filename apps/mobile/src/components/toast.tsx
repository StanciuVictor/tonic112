import { StyleSheet, Text, View } from 'react-native';
import { feedback, fonts, fontSizes, radii, spacing } from '../theme/tokens';

export type ToastVariant = 'success' | 'error' | 'warning';

export interface ToastProps {
  variant: ToastVariant;
  message: string;
}

export function Toast({ variant, message }: ToastProps) {
  const { background, text } = feedback[variant];

  return (
    <View style={[styles.toast, { backgroundColor: background }]}>
      <Text style={[styles.message, { color: text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  message: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
  },
});
