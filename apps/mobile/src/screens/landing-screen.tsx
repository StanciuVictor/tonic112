import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/button';
import { HeaderBand } from '../components/header-band';
import { SessionKind, usePartyStore } from '../store/party-store';
import { colors, fonts, fontSizes, spacing } from '../theme/tokens';

export default function LandingScreen() {
  const session = usePartyStore((s) => s.session);

  if (session?.kind === SessionKind.member) {
    return <Redirect href={`/join/identify?code=${session.party.code}`} />;
  }

  return (
    <View style={styles.container}>
      <HeaderBand accent="teal">
        <Text style={styles.title}>Tonic 112</Text>
      </HeaderBand>
      <View style={styles.content}>
        <Button
          onPress={() => router.push('/join')}
          testID="landing-join-button"
        >
          Join a Party
        </Button>
        <Button
          variant="secondary"
          onPress={() => router.push('/login')}
          testID="landing-login-button"
        >
          Log In
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
    gap: spacing.md,
  },
});
