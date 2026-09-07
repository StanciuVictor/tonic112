import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AuthForm } from '../components/auth-form';
import { HeaderBand } from '../components/header-band';
import { useAuthStore } from '../store/auth-store';
import { colors, fonts, fontSizes, spacing } from '../theme/tokens';

export default function AuthScreen() {
  const status = useAuthStore((s) => s.status);
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const destination = redirect ?? '/profile';

  if (status === 'authenticated') {
    return <Redirect href={destination} />;
  }

  return (
    <View style={styles.container}>
      <HeaderBand accent="teal">
        <Text style={styles.title}>Tonic 112</Text>
      </HeaderBand>
      <View style={styles.form}>
        <AuthForm onSuccess={() => router.replace(destination)} />
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
  form: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
});
