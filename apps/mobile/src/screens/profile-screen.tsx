import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/button';
import { HeaderBand } from '../components/header-band';
import { useAuthStore } from '../store/auth-store';
import { colors, fonts, fontSizes, spacing } from '../theme/tokens';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

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
