import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import {
  ParticipantDto,
  ParticipantKind,
  PartyMemberRole,
} from '@tonic112/shared-types';
import { Button } from '../components/button';
import { Card } from '../components/card';
import { HeaderBand } from '../components/header-band';
import { Toast } from '../components/toast';
import * as partyClient from '../lib/party-client';
import { useAuthStore } from '../store/auth-store';
import { colors, fonts, fontSizes, spacing } from '../theme/tokens';

const Status = {
  loading: 'loading',
  loaded: 'loaded',
  error: 'error',
} as const;
type Status = (typeof Status)[keyof typeof Status];

export default function ParticipantsScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const token = useAuthStore((s) => s.token);
  const [participants, setParticipants] = useState<ParticipantDto[]>([]);
  const [status, setStatus] = useState<Status>(Status.loading);
  const [error, setError] = useState<string | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !token) {
      router.replace('/');
      return;
    }
    let cancelled = false;
    partyClient
      .fetchParticipants(code, token)
      .then((result) => {
        if (!cancelled) {
          setParticipants(result);
          setStatus(Status.loaded);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Something went wrong.');
          setStatus(Status.error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code, token]);

  const handlePromote = async (userId: string) => {
    if (!code || !token) {
      return;
    }
    setPromotingId(userId);
    try {
      const promoted = await partyClient.promoteMember(code, userId, token);
      setParticipants((current) =>
        current.map((p) =>
          p.kind === ParticipantKind.member && p.userId === userId
            ? { ...p, role: promoted.role, promotedAt: promoted.promotedAt }
            : p,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBand accent="coral">
        <Text style={styles.title}>Participants</Text>
      </HeaderBand>
      <View style={styles.content}>
        {status === Status.loading && <Text>Loading…</Text>}
        {status === Status.error && (
          <Toast variant="error" message={error ?? 'Something went wrong.'} />
        )}
        {status === Status.loaded && (
          <FlatList
            data={participants}
            keyExtractor={(item) => `${item.kind}-${item.id}`}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Card style={styles.row}>
                <Text style={styles.name}>
                  {item.kind === ParticipantKind.member
                    ? item.name
                    : item.guestName}
                </Text>
                <Text style={styles.roleLabel}>
                  {item.kind === ParticipantKind.guest
                    ? 'Guest'
                    : item.role === PartyMemberRole.bartender
                      ? 'Bartender'
                      : 'Customer'}
                </Text>
                {item.kind === ParticipantKind.member &&
                  item.role === PartyMemberRole.customer && (
                    <Button
                      variant="secondary"
                      onPress={() => handlePromote(item.userId)}
                      disabled={promotingId === item.userId}
                      testID={`promote-button-${item.userId}`}
                    >
                      {promotingId === item.userId
                        ? 'Promoting…'
                        : 'Promote to bartender'}
                    </Button>
                  )}
              </Card>
            )}
          />
        )}
      </View>
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
    flex: 1,
    padding: spacing.xl,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xs,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.text.primary,
  },
  roleLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
});
