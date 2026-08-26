import { create } from 'zustand';
import {
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '@tonic112/shared-types';
import * as authClient from '../lib/auth-client';
import * as storage from '../lib/storage';

const TOKEN_KEY = 'tonic112.authToken';

export type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: AuthStatus;
  restoreSession: () => Promise<void>;
  login: (dto: LoginRequest) => Promise<void>;
  register: (dto: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  status: 'idle',

  restoreSession: async () => {
    const token = await storage.getItem(TOKEN_KEY);
    if (!token) {
      set({ status: 'unauthenticated' });
      return;
    }
    try {
      const user = await authClient.fetchMe(token);
      set({ user, token, status: 'authenticated' });
    } catch {
      await storage.deleteItem(TOKEN_KEY);
      set({ user: null, token: null, status: 'unauthenticated' });
    }
  },

  login: async (dto) => {
    const { accessToken, user } = await authClient.login(dto);
    await storage.setItem(TOKEN_KEY, accessToken);
    set({ user, token: accessToken, status: 'authenticated' });
  },

  register: async (dto) => {
    const { accessToken, user } = await authClient.register(dto);
    await storage.setItem(TOKEN_KEY, accessToken);
    set({ user, token: accessToken, status: 'authenticated' });
  },

  logout: async () => {
    await storage.deleteItem(TOKEN_KEY);
    set({ user: null, token: null, status: 'unauthenticated' });
  },
}));
