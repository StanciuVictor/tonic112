import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/button';
import { HeaderBand } from '../components/header-band';
import { Input } from '../components/input';
import { Toast } from '../components/toast';
import { usePartyStore } from '../store/party-store';
import { colors, fonts, fontSizes, spacing } from '../theme/tokens';

const Status = {
  entry: 'entry',
  loading: 'loading',
  error: 'error',
} as const;
type Status = (typeof Status)[keyof typeof Status];

export default function JoinEntryScreen() {
  const { code: codeParam } = useLocalSearchParams<{ code?: string }>();
  const resolveCode = usePartyStore((s) => s.resolveCode);
  const [codeInput, setCodeInput] = useState('');
  const [status, setStatus] = useState<Status>(
    codeParam ? Status.loading : Status.entry,
  );
  const [error, setError] = useState<string | null>(null);

  const validate = async (code: string) => {
    setStatus(Status.loading);
    setError(null);
    try {
      const party = await resolveCode(code);
      router.push(`/join/identify?code=${party.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStatus(Status.error);
    }
  };

  useEffect(() => {
    if (codeParam) {
      validate(codeParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam]);

  return (
    <View style={styles.container}>
      <HeaderBand accent="teal">
        <Text style={styles.title}>Join a Party</Text>
      </HeaderBand>
      <View style={styles.content}>
        {status === Status.entry && (
          <>
            <Input
              label="Backup code"
              value={codeInput}
              onChangeText={setCodeInput}
              autoCapitalize="characters"
              testID="join-code-input"
            />
            <Button
              onPress={() => validate(codeInput.trim())}
              disabled={!codeInput.trim()}
              testID="join-code-submit"
            >
              Continue
            </Button>
          </>
        )}
        {status === Status.loading && <Text>Checking code…</Text>}
        {status === Status.error && (
          <>
            <Toast
              variant="error"
              message={error ?? 'Invalid or ended party.'}
            />
            <Button
              variant="secondary"
              onPress={() => {
                setStatus(Status.entry);
                setError(null);
              }}
              testID="join-code-retry"
            >
              Try a different code
            </Button>
          </>
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
    padding: spacing.xl,
    gap: spacing.md,
  },
});
