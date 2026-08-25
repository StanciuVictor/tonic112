export interface JwtPayload {
  sub: string;
  isAdmin: boolean;
  canCreateParty: boolean;
}
