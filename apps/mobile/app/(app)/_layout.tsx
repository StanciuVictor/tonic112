import { Redirect } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useAuthStore } from '../../src/store/auth-store';

export default function ProtectedLayout() {
  const status = useAuthStore((s) => s.status);

  if (status !== 'authenticated') {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
