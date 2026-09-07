export const PartyStatus = {
  active: 'active',
  ended: 'ended',
} as const;
export type PartyStatus = (typeof PartyStatus)[keyof typeof PartyStatus];

export const PartyMemberRole = {
  customer: 'customer',
  bartender: 'bartender',
} as const;
export type PartyMemberRole =
  (typeof PartyMemberRole)[keyof typeof PartyMemberRole];

export interface PartyDto {
  id: string;
  code: string;
  status: PartyStatus;
  createdByUserId: string;
  createdAt: string;
  startedAt: string;
  endedAt: string | null;
  joinUrl: string;
}

export interface PartyMemberDto {
  id: string;
  partyId: string;
  userId: string;
  role: PartyMemberRole;
  joinedAt: string;
  promotedAt: string | null;
}

export interface GuestIdentity {
  id: string;
  partyId: string;
  guestName: string;
}

export interface GuestJoinResponse {
  accessToken: string;
  guest: GuestIdentity;
}
