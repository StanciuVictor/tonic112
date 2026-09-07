import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
} from '@expo-google-fonts/fredoka';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router/stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store/auth-store';
import { usePartyStore } from '../src/store/party-store';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const authStatus = useAuthStore((s) => s.status);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const restorePartySession = usePartyStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
    restorePartySession();
  }, [restoreSession, restorePartySession]);

  const ready = (fontsLoaded || fontError) && authStatus !== 'idle';

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack />
    </QueryClientProvider>
  );
}
