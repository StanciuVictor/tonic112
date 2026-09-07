import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { PartyDto } from '@tonic112/shared-types';
import { colors, fonts, fontSizes, spacing } from '../theme/tokens';

export interface PartyQrCodeProps {
  party: Pick<PartyDto, 'code' | 'joinUrl'>;
}

export function PartyQrCode({ party }: PartyQrCodeProps) {
  return (
    <View style={styles.container}>
      <QRCode value={party.joinUrl} size={180} />
      <Text style={styles.codeLabel}>Backup code</Text>
      <Text style={styles.code}>{party.code}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  codeLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.text.muted,
    marginTop: spacing.sm,
  },
  code: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
    color: colors.text.primary,
    letterSpacing: 2,
  },
});
