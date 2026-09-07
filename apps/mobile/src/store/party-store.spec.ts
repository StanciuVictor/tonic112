import {
  PartyDto,
  PartyMemberDto,
  PartyMemberRole,
  PartyStatus,
} from '@tonic112/shared-types';
import { useAuthStore } from './auth-store';
import { SessionKind, usePartyStore } from './party-store';
import * as partyClient from '../lib/party-client';
import * as storage from '../lib/storage';

jest.mock('../lib/party-client');
jest.mock('../lib/storage');

const mockParty: PartyDto = {
  id: 'party-1',
  code: 'ABC234',
  status: PartyStatus.active,
  createdByUserId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  startedAt: '2026-01-01T00:00:00.000Z',
  endedAt: null,
  joinUrl: 'https://example.test/join?code=qr-token',
};

const mockMember: PartyMemberDto = {
  id: 'member-1',
  partyId: 'party-1',
  userId: 'user-2',
  role: PartyMemberRole.customer,
  joinedAt: '2026-01-01T00:00:00.000Z',
  promotedAt: null,
};

describe('usePartyStore', () => {
  beforeEach(() => {
    usePartyStore.setState({ party: null, session: null });
    useAuthStore.setState({ user: null, token: null, status: 'idle' });
    jest.clearAllMocks();
  });

  it('stores the resolved party on resolveCode', async () => {
    (partyClient.fetchPartyByCode as jest.Mock).mockResolvedValue(mockParty);

    const result = await usePartyStore.getState().resolveCode('ABC234');

    expect(result).toEqual(mockParty);
    expect(usePartyStore.getState().party).toEqual(mockParty);
  });

  it('joins as a guest and persists the resulting session', async () => {
    usePartyStore.setState({ party: mockParty });
    (partyClient.joinAsGuest as jest.Mock).mockResolvedValue({
      accessToken: 'guest-jwt',
      guest: { id: 'guest-1', partyId: mockParty.id, guestName: 'Alex' },
    });

    await usePartyStore.getState().joinAsGuest('Alex');

    expect(partyClient.joinAsGuest).toHaveBeenCalledWith('ABC234', 'Alex');
    expect(storage.setItem).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
    );
    expect(usePartyStore.getState().session).toEqual({
      kind: SessionKind.guest,
      party: mockParty,
      guest: { id: 'guest-1', partyId: mockParty.id, guestName: 'Alex' },
      accessToken: 'guest-jwt',
    });
  });

  it('throws when joining as a guest before a party has been resolved', async () => {
    await expect(usePartyStore.getState().joinAsGuest('Alex')).rejects.toThrow(
      'No party resolved yet',
    );
    expect(partyClient.joinAsGuest).not.toHaveBeenCalled();
  });

  it('joins as the current authenticated user and persists the resulting session', async () => {
    usePartyStore.setState({ party: mockParty });
    useAuthStore.setState({ token: 'user-jwt' });
    (partyClient.joinAsUser as jest.Mock).mockResolvedValue(mockMember);

    const result = await usePartyStore.getState().joinAsUser();

    expect(partyClient.joinAsUser).toHaveBeenCalledWith('ABC234', 'user-jwt');
    expect(result).toEqual(mockMember);
    expect(usePartyStore.getState().session).toEqual({
      kind: SessionKind.member,
      party: mockParty,
      member: mockMember,
    });
  });

  it('throws when joining as a user with no auth token', async () => {
    usePartyStore.setState({ party: mockParty });

    await expect(usePartyStore.getState().joinAsUser()).rejects.toThrow(
      'Not authenticated',
    );
    expect(partyClient.joinAsUser).not.toHaveBeenCalled();
  });

  it('restores a persisted session from storage', async () => {
    const session = {
      kind: SessionKind.guest,
      party: mockParty,
      guest: { id: 'guest-1', partyId: mockParty.id, guestName: 'Alex' },
      accessToken: 'guest-jwt',
    };
    (storage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(session));

    await usePartyStore.getState().restoreSession();

    expect(usePartyStore.getState()).toMatchObject({
      session,
      party: mockParty,
    });
  });

  it('does nothing when no session is stored', async () => {
    (storage.getItem as jest.Mock).mockResolvedValue(null);

    await usePartyStore.getState().restoreSession();

    expect(usePartyStore.getState().session).toBeNull();
  });

  it('clears the stored session and resets state', async () => {
    usePartyStore.setState({
      party: mockParty,
      session: {
        kind: SessionKind.member,
        party: mockParty,
        member: mockMember,
      },
    });

    await usePartyStore.getState().clear();

    expect(storage.deleteItem).toHaveBeenCalled();
    expect(usePartyStore.getState()).toMatchObject({
      party: null,
      session: null,
    });
  });
});
