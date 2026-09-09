import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

// Unlike canCreateParty (trusted directly from the JWT — see
// architecture-and-product-spec.md Section 5), isAdmin is checked live
// against the User table at request time, the same way BartenderGuard
// checks PartyMember — a stale or leaked 30-day token shouldn't keep
// granting admin access after the flag is revoked out-of-band.
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload | undefined = request.user;

    const dbUser = user?.sub
      ? await this.prisma.user.findUnique({
          where: { id: user.sub },
          select: { isAdmin: true },
        })
      : null;

    if (!dbUser?.isAdmin) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
