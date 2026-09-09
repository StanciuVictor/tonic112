import { SetMetadata } from '@nestjs/common';

// NOTE: as of Epic 06, isAdmin is checked live against the database via
// AdminGuard (apps/api/src/app/auth/guards/admin.guard.ts), not trusted from
// the JWT — do not gate a new isAdmin-only route with
// `@UseGuards(FlagsGuard) @RequireFlags('isAdmin')`, which would silently
// skip that check. canCreateParty remains JWT-trusted and uses FlagsGuard.
export type AuthFlag = 'isAdmin' | 'canCreateParty';

export const REQUIRE_FLAGS_KEY = 'requireFlags';
export const RequireFlags = (...flags: AuthFlag[]) =>
  SetMetadata(REQUIRE_FLAGS_KEY, flags);
