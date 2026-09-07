import { Modal, StyleSheet, View } from 'react-native';
import { PartyDto } from '@tonic112/shared-types';
import { Button } from './button';
import { Card } from './card';
import { PartyQrCode } from './party-qr-code';
import { spacing } from '../theme/tokens';

export interface PartyInviteModalProps {
  visible: boolean;
  party: Pick<PartyDto, 'code' | 'joinUrl'>;
  onClose: () => void;
}

export function PartyInviteModal({
  visible,
  party,
  onClose,
}: PartyInviteModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Card style={styles.card}>
          <PartyQrCode party={party} />
          <Button
            variant="secondary"
            onPress={onClose}
            testID="party-invite-modal-close"
          >
            Close
          </Button>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: spacing.lg,
  },
});
