import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme/tokens';

export type HeaderBandAccent = 'teal' | 'coral';

export interface HeaderBandProps {
  accent: HeaderBandAccent;
  children: ReactNode;
}

export function HeaderBand({ accent, children }: HeaderBandProps) {
  return (
    <View
      style={[
        styles.band,
        { backgroundColor: accent === 'teal' ? colors.accent.teal : colors.accent.coral },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
