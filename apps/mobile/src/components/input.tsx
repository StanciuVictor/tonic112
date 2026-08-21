import { TextInput, TextInputProps, StyleSheet, Text, View } from 'react-native';
import { colors, feedback, fonts, fontSizes, radii, spacing } from '../theme/tokens';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...textInputProps }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.text.muted}
        {...textInputProps}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.text.primary,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text.primary,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.text.mutedAlt,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: feedback.error.text,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: feedback.error.text,
  },
});
