import { useAuthStore } from '../store/auth-store';
import { SessionKind, usePartyStore } from '../store/party-store';

/**
 * The token to use for "any authenticated participant" endpoints (e.g. the
 * catalog) — a guest's own short-lived party JWT, or the registered user's
 * token for a member session. Returns null if there's no party session at
 * all. Needed because these screens are the first in the app reachable by
 * anonymous guests, who never authenticate via useAuthStore.
 */
export function usePartyAccessToken(): string | null {
  const session = usePartyStore((s) => s.session);
  const authToken = useAuthStore((s) => s.token);
  if (!session) {
    return null;
  }
  return session.kind === SessionKind.guest ? session.accessToken : authToken;
}
