import {
  ActivePartyMembershipDto,
  GuestJoinResponse,
  ParticipantDto,
  PartyDto,
  PartyMemberDto,
} from '@tonic112/shared-types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (Array.isArray(body.message)) {
      return body.message.join(' ');
    }
    if (typeof body.message === 'string') {
      return body.message;
    }
  } catch {
    // Response body wasn't JSON — fall through to the generic message below.
  }
  return `Request failed with status ${response.status}`;
}

export async function createParty(token: string): Promise<PartyDto> {
  const response = await fetch(`${API_URL}/parties`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function fetchPartyByCode(code: string): Promise<PartyDto> {
  const response = await fetch(`${API_URL}/parties/${code}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function joinAsGuest(
  code: string,
  guestName: string,
): Promise<GuestJoinResponse> {
  const response = await fetch(`${API_URL}/parties/${code}/join/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestName }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function joinAsUser(
  code: string,
  token: string,
): Promise<PartyMemberDto> {
  const response = await fetch(`${API_URL}/parties/${code}/join/user`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function fetchMyMembership(
  code: string,
  token: string,
): Promise<PartyMemberDto> {
  const response = await fetch(`${API_URL}/parties/${code}/members/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function fetchParticipants(
  code: string,
  token: string,
): Promise<ParticipantDto[]> {
  const response = await fetch(`${API_URL}/parties/${code}/participants`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function promoteMember(
  code: string,
  userId: string,
  token: string,
): Promise<PartyMemberDto> {
  const response = await fetch(
    `${API_URL}/parties/${code}/members/${userId}/promote`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function fetchMyActiveParty(
  token: string,
): Promise<ActivePartyMembershipDto> {
  const response = await fetch(`${API_URL}/parties/me/active`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function demoteSelf(
  code: string,
  token: string,
): Promise<PartyMemberDto> {
  const response = await fetch(`${API_URL}/parties/${code}/members/me/demote`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

export async function leaveParty(code: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/parties/${code}/leave`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
}

export async function endParty(code: string, token: string): Promise<PartyDto> {
  const response = await fetch(`${API_URL}/parties/${code}/end`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}
