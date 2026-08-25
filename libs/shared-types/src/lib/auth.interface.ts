export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  canCreateParty: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
