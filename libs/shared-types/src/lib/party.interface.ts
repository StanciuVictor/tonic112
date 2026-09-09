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

export const ParticipantKind = {
  member: 'member',
  guest: 'guest',
} as const;
export type ParticipantKind =
  (typeof ParticipantKind)[keyof typeof ParticipantKind];

export interface MemberParticipantDto {
  kind: typeof ParticipantKind.member;
  id: string;
  userId: string;
  name: string;
  role: PartyMemberRole;
  joinedAt: string;
  promotedAt: string | null;
}

export interface GuestParticipantDto {
  kind: typeof ParticipantKind.guest;
  id: string;
  guestName: string;
  joinedAt: string;
}

export type ParticipantDto = MemberParticipantDto | GuestParticipantDto;

export interface ActivePartyMembershipDto {
  party: PartyDto;
  member: PartyMemberDto;
}
