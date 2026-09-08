import { create } from 'zustand';
import {
  GuestIdentity,
  PartyDto,
  PartyMemberDto,
} from '@tonic112/shared-types';
import * as partyClient from '../lib/party-client';
import * as storage from '../lib/storage';
import { useAuthStore } from './auth-store';

const SESSION_KEY = 'tonic112.partySession';

export const SessionKind = {
  guest: 'guest',
  member: 'member',
} as const;
export type SessionKind = (typeof SessionKind)[keyof typeof SessionKind];

export type PartySession =
  | {
      kind: typeof SessionKind.guest;
      party: PartyDto;
      guest: GuestIdentity;
      accessToken: string;
    }
  | {
      kind: typeof SessionKind.member;
      party: PartyDto;
      member: PartyMemberDto;
    };

interface PartyState {
  party: PartyDto | null;
  session: PartySession | null;
  resolveCode: (code: string) => Promise<PartyDto>;
  joinAsGuest: (guestName: string) => Promise<void>;
  joinAsUser: () => Promise<PartyMemberDto>;
  refreshMyMembership: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clear: () => Promise<void>;
}

export const usePartyStore = create<PartyState>((set, get) => ({
  party: null,
  session: null,

  resolveCode: async (code) => {
    const party = await partyClient.fetchPartyByCode(code);
    set({ party });
    return party;
  },

  joinAsGuest: async (guestName) => {
    const party = get().party;
    if (!party) {
      throw new Error('No party resolved yet');
    }
    const { accessToken, guest } = await partyClient.joinAsGuest(
      party.code,
      guestName,
    );
    const session: PartySession = {
      kind: SessionKind.guest,
      party,
      guest,
      accessToken,
    };
    await storage.setItem(SESSION_KEY, JSON.stringify(session));
    set({ session });
  },

  joinAsUser: async () => {
    const party = get().party;
    if (!party) {
      throw new Error('No party resolved yet');
    }
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error('Not authenticated');
    }
    const member = await partyClient.joinAsUser(party.code, token);
    const session: PartySession = { kind: SessionKind.member, party, member };
    await storage.setItem(SESSION_KEY, JSON.stringify(session));
    set({ session });
    return member;
  },

  refreshMyMembership: async () => {
    const session = get().session;
    if (!session || session.kind !== SessionKind.member) {
      return;
    }
    const token = useAuthStore.getState().token;
    if (!token) {
      return;
    }
    const member = await partyClient.fetchMyMembership(
      session.party.code,
      token,
    );
    const refreshed: PartySession = { ...session, member };
    await storage.setItem(SESSION_KEY, JSON.stringify(refreshed));
    set({ session: refreshed });
  },

  restoreSession: async () => {
    const raw = await storage.getItem(SESSION_KEY);
    if (!raw) {
      return;
    }
    try {
      const session: PartySession = JSON.parse(raw);
      set({ session, party: session.party });
    } catch {
      await storage.deleteItem(SESSION_KEY);
    }
  },

  clear: async () => {
    await storage.deleteItem(SESSION_KEY);
    set({ party: null, session: null });
  },
}));
