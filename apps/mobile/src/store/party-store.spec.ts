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

  it('refreshes the current member session with the latest role', async () => {
    usePartyStore.setState({
      party: mockParty,
      session: {
        kind: SessionKind.member,
        party: mockParty,
        member: mockMember,
      },
    });
    useAuthStore.setState({ token: 'user-jwt' });
    const promotedMember: PartyMemberDto = {
      ...mockMember,
      role: PartyMemberRole.bartender,
      promotedAt: '2026-01-01T06:00:00.000Z',
    };
    (partyClient.fetchMyMembership as jest.Mock).mockResolvedValue(
      promotedMember,
    );

    await usePartyStore.getState().refreshMyMembership();

    expect(partyClient.fetchMyMembership).toHaveBeenCalledWith(
      'ABC234',
      'user-jwt',
    );
    expect(usePartyStore.getState().session).toEqual({
      kind: SessionKind.member,
      party: mockParty,
      member: promotedMember,
    });
  });

  it('does nothing when refreshing membership with a guest session', async () => {
    usePartyStore.setState({
      party: mockParty,
      session: {
        kind: SessionKind.guest,
        party: mockParty,
        guest: { id: 'guest-1', partyId: mockParty.id, guestName: 'Alex' },
        accessToken: 'guest-jwt',
      },
    });

    await usePartyStore.getState().refreshMyMembership();

    expect(partyClient.fetchMyMembership).not.toHaveBeenCalled();
  });

  it('adopts a member session directly via setMemberSession', async () => {
    await usePartyStore.getState().setMemberSession(mockParty, mockMember);

    expect(storage.setItem).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
    );
    expect(usePartyStore.getState()).toMatchObject({
      party: mockParty,
      session: {
        kind: SessionKind.member,
        party: mockParty,
        member: mockMember,
      },
    });
  });

  it('restores the active party membership from the server on restoreActiveParty', async () => {
    useAuthStore.setState({ token: 'user-jwt' });
    (partyClient.fetchMyActiveParty as jest.Mock).mockResolvedValue({
      party: mockParty,
      member: mockMember,
    });

    await usePartyStore.getState().restoreActiveParty();

    expect(partyClient.fetchMyActiveParty).toHaveBeenCalledWith('user-jwt');
    expect(usePartyStore.getState()).toMatchObject({
      party: mockParty,
      session: {
        kind: SessionKind.member,
        party: mockParty,
        member: mockMember,
      },
    });
  });

  it('does nothing when restoreActiveParty has no auth token', async () => {
    await usePartyStore.getState().restoreActiveParty();

    expect(partyClient.fetchMyActiveParty).not.toHaveBeenCalled();
  });

  it('clears a stale cached member session when the server has no active party', async () => {
    useAuthStore.setState({ token: 'user-jwt' });
    usePartyStore.setState({
      party: mockParty,
      session: {
        kind: SessionKind.member,
        party: mockParty,
        member: mockMember,
      },
    });
    (partyClient.fetchMyActiveParty as jest.Mock).mockRejectedValue(
      new Error('Not found'),
    );

    await usePartyStore.getState().restoreActiveParty();

    expect(storage.deleteItem).toHaveBeenCalled();
    expect(usePartyStore.getState()).toMatchObject({
      party: null,
      session: null,
    });
  });

  it('demotes the current user to customer', async () => {
    usePartyStore.setState({
      party: mockParty,
      session: {
        kind: SessionKind.member,
        party: mockParty,
        member: { ...mockMember, role: PartyMemberRole.bartender },
      },
    });
    useAuthStore.setState({ token: 'user-jwt' });
    (partyClient.demoteSelf as jest.Mock).mockResolvedValue(mockMember);

    const result = await usePartyStore.getState().demoteSelf();

    expect(partyClient.demoteSelf).toHaveBeenCalledWith('ABC234', 'user-jwt');
    expect(result).toEqual(mockMember);
    expect(usePartyStore.getState().session).toEqual({
      kind: SessionKind.member,
      party: mockParty,
      member: mockMember,
    });
  });

  it('throws when demoting self without a party session', async () => {
    await expect(usePartyStore.getState().demoteSelf()).rejects.toThrow(
      'Not a member of a party',
    );
    expect(partyClient.demoteSelf).not.toHaveBeenCalled();
  });

  it('leaves the current party and clears the session', async () => {
    usePartyStore.setState({
      party: mockParty,
      session: {
        kind: SessionKind.member,
        party: mockParty,
        member: mockMember,
      },
    });
    useAuthStore.setState({ token: 'user-jwt' });
    (partyClient.leaveParty as jest.Mock).mockResolvedValue(undefined);

    await usePartyStore.getState().leave();

    expect(partyClient.leaveParty).toHaveBeenCalledWith('ABC234', 'user-jwt');
    expect(usePartyStore.getState()).toMatchObject({
      party: null,
      session: null,
    });
  });

  it('throws when leaving without a party session', async () => {
    await expect(usePartyStore.getState().leave()).rejects.toThrow(
      'Not a member of a party',
    );
    expect(partyClient.leaveParty).not.toHaveBeenCalled();
  });

  it('ends the current party and clears the session', async () => {
    usePartyStore.setState({
      party: mockParty,
      session: {
        kind: SessionKind.member,
        party: mockParty,
        member: mockMember,
      },
    });
    useAuthStore.setState({ token: 'user-jwt' });
    (partyClient.endParty as jest.Mock).mockResolvedValue(mockParty);

    await usePartyStore.getState().endParty();

    expect(partyClient.endParty).toHaveBeenCalledWith('ABC234', 'user-jwt');
    expect(usePartyStore.getState()).toMatchObject({
      party: null,
      session: null,
    });
  });

  it('throws when ending a party without a party session', async () => {
    await expect(usePartyStore.getState().endParty()).rejects.toThrow(
      'Not a member of a party',
    );
    expect(partyClient.endParty).not.toHaveBeenCalled();
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
