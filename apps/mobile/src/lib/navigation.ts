import { router } from 'expo-router';
import { useAuthStore } from '../store/auth-store';

/** Sends the user to their account home if logged in, or Landing otherwise. */
export function goHome(): void {
  const isAuthenticated = useAuthStore.getState().status === 'authenticated';
  router.replace(isAuthenticated ? '/profile' : '/');
}
