import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PartyDto } from '@tonic112/shared-types';
import { Button } from '../components/button';
import { Card } from '../components/card';
import { HeaderBand } from '../components/header-band';
import { PartyInviteModal } from '../components/party-invite-modal';
import { PartyQrCode } from '../components/party-qr-code';
import { Toast } from '../components/toast';
import * as partyClient from '../lib/party-client';
import { useAuthStore } from '../store/auth-store';
import { colors, fonts, fontSizes, spacing } from '../theme/tokens';

export default function BartenderHomeScreen() {
  const token = useAuthStore((s) => s.token);
  const [party, setParty] = useState<PartyDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleCreate = async () => {
    if (!token) {
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const created = await partyClient.createParty(token);
      setParty(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBand
        accent="coral"
        onQrPress={party ? () => setModalVisible(true) : undefined}
      >
        <Text style={styles.title}>Bartender Home</Text>
      </HeaderBand>
      <View style={styles.content}>
        {!party && (
          <>
            <Text style={styles.emptyText}>
              No active party yet. Create one to get started.
            </Text>
            {error && <Toast variant="error" message={error} />}
            <Button
              onPress={handleCreate}
              loading={creating}
              disabled={creating}
              testID="create-party-button"
            >
              Create Party
            </Button>
          </>
        )}
        {party && (
          <>
            <Card style={styles.qrCard}>
              <PartyQrCode party={party} />
            </Card>
            <Button
              variant="secondary"
              onPress={() => router.push(`/participants?code=${party.code}`)}
              testID="view-participants-button"
            >
              View Participants
            </Button>
          </>
        )}
      </View>
      {party && (
        <PartyInviteModal
          visible={modalVisible}
          party={party}
          onClose={() => setModalVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.surface,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text.muted,
  },
  qrCard: {
    alignItems: 'center',
  },
});
