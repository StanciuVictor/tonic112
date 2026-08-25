import { SetMetadata } from '@nestjs/common';

export type AuthFlag = 'isAdmin' | 'canCreateParty';

export const REQUIRE_FLAGS_KEY = 'requireFlags';
export const RequireFlags = (...flags: AuthFlag[]) =>
  SetMetadata(REQUIRE_FLAGS_KEY, flags);
