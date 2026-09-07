export type PartyStatus = 'active' | 'ended';

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
