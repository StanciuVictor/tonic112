import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buttonTokens, colors, spacing } from '../theme/tokens';

export type HeaderBandAccent = 'teal' | 'coral';

export interface HeaderBandProps {
  accent: HeaderBandAccent;
  children: ReactNode;
  /** Shows a QR/code icon on the band, for pulling up the current party's invite info. */
  onQrPress?: () => void;
  /** Shows a back-chevron icon on the leading edge of the band, for nested screens. */
  onBackPress?: () => void;
}

export function HeaderBand({
  accent,
  children,
  onQrPress,
  onBackPress,
}: HeaderBandProps) {
  const t = buttonTokens.onHeader[accent];
  return (
    <View
      style={[
        styles.band,
        {
          backgroundColor:
            accent === 'teal' ? colors.accent.teal : colors.accent.coral,
        },
      ]}
    >
      {onBackPress && (
        <Pressable
          onPress={onBackPress}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="header-back-button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.sideButton,
            { backgroundColor: pressed ? t.bgActive : t.bg },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={t.fg} />
        </Pressable>
      )}
      <View style={styles.content}>{children}</View>
      {onQrPress && (
        <Pressable
          onPress={onQrPress}
          accessibilityRole="button"
          accessibilityLabel="Show party invite QR code"
          testID="header-qr-button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.sideButton,
            { backgroundColor: pressed ? t.bgActive : t.bg },
          ]}
        >
          <Ionicons name="qr-code-outline" size={20} color={t.fg} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  content: {
    flex: 1,
    flexShrink: 1,
  },
  sideButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
