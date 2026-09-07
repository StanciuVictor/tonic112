export const AuthRole = {
  guest: 'guest',
} as const;

export type AuthRole = (typeof AuthRole)[keyof typeof AuthRole];
