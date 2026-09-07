import { AuthRole } from './auth-role';

export interface PartyGuestJwtPayload {
  role: typeof AuthRole.guest;
  partyId: string;
  guestId: string;
}
