import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PartyMemberRole } from '@tonic112/shared-types';
import { Button } from '../components/button';
import { HeaderBand } from '../components/header-band';
import { Input } from '../components/input';
import { PartyInviteModal } from '../components/party-invite-modal';
import { Toast } from '../components/toast';
import * as partyClient from '../lib/party-client';
import { useAuthStore } from '../store/auth-store';
import { usePartyStore } from '../store/party-store';
import { colors, fonts, fontSizes, spacing } from '../theme/tokens';

const Status = {
  loading: 'loading',
  choose: 'choose',
  guestForm: 'guestForm',
  joining: 'joining',
  joined: 'joined',
  error: 'error',
} as const;
type Status = (typeof Status)[keyof typeof Status];

export default function IdentifyScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const authStatus = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const party = usePartyStore((s) => s.party);
  const session = usePartyStore((s) => s.session);
  const resolveCode = usePartyStore((s) => s.resolveCode);
  const joinAsUser = usePartyStore((s) => s.joinAsUser);
  const joinAsGuest = usePartyStore((s) => s.joinAsGuest);
  const refreshMyMembership = usePartyStore((s) => s.refreshMyMembership);
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(Status.loading);
  const [modalVisible, setModalVisible] = useState(false);
  const [becomingBartender, setBecomingBartender] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (status === Status.joined && session?.kind === 'member') {
        refreshMyMembership();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, session?.kind]),
  );

  const handleBecomeBartender = async () => {
    if (!code || !token || !user) {
      return;
    }
    setBecomingBartender(true);
    setError(null);
    try {
      await partyClient.promoteMember(code, user.id, token);
      await refreshMyMembership();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBecomingBartender(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!code) {
        router.replace('/join');
        return;
      }
      if (!party || party.code !== code) {
        try {
          await resolveCode(code);
        } catch (e) {
          if (cancelled) {
            return;
          }
          setError(e instanceof Error ? e.message : 'Something went wrong.');
          setStatus(Status.error);
          return;
        }
      }
      if (cancelled) {
        return;
      }
      if (authStatus === 'authenticated') {
        setStatus(Status.joining);
        try {
          await joinAsUser();
          if (!cancelled) {
            setStatus(Status.joined);
          }
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : 'Something went wrong.');
            setStatus(Status.error);
          }
        }
        return;
      }
      setStatus(Status.choose);
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, authStatus]);

  const handleGuestSubmit = async () => {
    setStatus(Status.joining);
    setError(null);
    try {
      await joinAsGuest(guestName.trim());
      setStatus(Status.joined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStatus(Status.error);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBand
        accent="teal"
        onQrPress={
          status === Status.joined && session
            ? () => setModalVisible(true)
            : undefined
        }
      >
        <Text style={styles.title}>Join a Party</Text>
      </HeaderBand>
      <View style={styles.content}>
        {(status === Status.loading || status === Status.joining) && (
          <Text>{status === Status.joining ? 'Joining…' : 'Loading…'}</Text>
        )}
        {status === Status.error && (
          <Toast variant="error" message={error ?? 'Something went wrong.'} />
        )}
        {status === Status.choose && (
          <>
            <Button
              onPress={() =>
                router.push(
                  `/login?redirect=${encodeURIComponent(
                    `/join/identify?code=${code}`,
                  )}`,
                )
              }
              testID="identify-login-button"
            >
              Log in
            </Button>
            <Button
              variant="secondary"
              onPress={() => setStatus(Status.guestForm)}
              testID="identify-guest-button"
            >
              Continue as guest
            </Button>
          </>
        )}
        {status === Status.guestForm && (
          <>
            <Input
              label="Your name"
              value={guestName}
              onChangeText={setGuestName}
              testID="identify-guest-name-input"
            />
            <Button
              onPress={handleGuestSubmit}
              disabled={!guestName.trim()}
              testID="identify-guest-submit"
            >
              Join
            </Button>
          </>
        )}
        {status === Status.joined && session && (
          <View style={styles.joinedActions}>
            <Text style={styles.joinedTitle}>You're in!</Text>
            <Text style={styles.joinedSubtitle}>
              Party code: {session.party.code}
            </Text>
            {session.kind === 'member' &&
              session.member.role === PartyMemberRole.bartender && (
                <Button
                  variant="secondary"
                  onPress={() =>
                    router.push(`/participants?code=${session.party.code}`)
                  }
                  testID="identify-view-participants-button"
                >
                  View Participants
                </Button>
              )}
            {session.kind === 'member' &&
              session.member.role === PartyMemberRole.customer &&
              user?.canCreateParty && (
                <Button
                  variant="secondary"
                  onPress={handleBecomeBartender}
                  disabled={becomingBartender}
                  testID="identify-become-bartender-button"
                >
                  {becomingBartender
                    ? 'Becoming a bartender…'
                    : 'Become a bartender for this party'}
                </Button>
              )}
          </View>
        )}
      </View>
      {status === Status.joined && session && (
        <PartyInviteModal
          visible={modalVisible}
          party={session.party}
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
  joinedTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.text.primary,
  },
  joinedSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text.muted,
  },
  joinedActions: {
    gap: spacing.md,
  },
});
