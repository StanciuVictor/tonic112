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

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
