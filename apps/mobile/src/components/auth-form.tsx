import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './button';
import { Input } from './input';
import { Toast } from './toast';
import { useAuthStore } from '../store/auth-store';
import { colors, fonts, fontSizes, spacing } from '../theme/tokens';

export interface AuthFormProps {
  onSuccess: () => void;
}

type Mode = 'login' | 'register';

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, password, name });
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {mode === 'register' && (
        <Input
          label="Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          testID="auth-name-input"
        />
      )}
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="auth-email-input"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        testID="auth-password-input"
      />
      {mode === 'register' && (
        <Text style={styles.hint}>
          At least 8 characters, with an uppercase letter, a lowercase letter, a
          number, and a symbol.
        </Text>
      )}
      {error && <Toast variant="error" message={error} />}
      <Button
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
        testID="auth-submit-button"
      >
        {mode === 'login' ? 'Log in' : 'Create account'}
      </Button>
      <Button
        variant="link"
        onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
        testID="auth-mode-toggle"
      >
        {mode === 'login'
          ? "Don't have an account? Register"
          : 'Already have an account? Log in'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.text.muted,
  },
});
