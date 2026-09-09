import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/button';
import { HeaderBand } from '../components/header-band';
import { useAuthStore } from '../store/auth-store';
import { SessionKind, usePartyStore } from '../store/party-store';
import { colors, fonts, fontSizes, spacing } from '../theme/tokens';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const session = usePartyStore((s) => s.session);
  const clearPartySession = usePartyStore((s) => s.clear);

  const handleLogout = async () => {
    await logout();
    await clearPartySession();
    router.replace('/login');
  };

  if (session?.kind === SessionKind.member) {
    return <Redirect href={`/join/identify?code=${session.party.code}`} />;
  }

  return (
    <View style={styles.container}>
      <HeaderBand accent="coral">
        <Text style={styles.title}>Profile</Text>
      </HeaderBand>
      <View style={styles.content}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Button
          onPress={() => router.push('/join')}
          testID="profile-join-party-button"
        >
          Join a Party
        </Button>
        {user?.canCreateParty && (
          <Button
            onPress={() => router.push('/bartender-home')}
            testID="profile-start-party-button"
          >
            Start a Party
          </Button>
        )}
        <Button
          variant="secondary"
          onPress={handleLogout}
          testID="logout-button"
        >
          Log out
        </Button>
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
    padding: spacing.xl,
    gap: spacing.sm,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.text.primary,
  },
  email: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text.muted,
    marginBottom: spacing.lg,
  },
});
