import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PartyMemberRole } from '../../../../generated/prisma/client';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';

// Bartender status is party-scoped and can change mid-session (promotion),
// so it's checked live against PartyMember on every request — never trusted
// from the JWT, unlike isAdmin/canCreateParty. The one exception is
// self-promotion: a canCreateParty holder promoting themselves is authorized
// straight from the JWT, since that flag is itself an out-of-band grant of
// trust (see architecture-and-product-spec.md Section 2 and Epic 05).
@Injectable()
export class BartenderGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;
    const code: string = request.params.code;

    const party = await this.prisma.party.findFirst({
      where: { OR: [{ code }, { qrToken: code }] },
    });
    if (!party) {
      throw new NotFoundException('Party not found');
    }

    const membership = await this.prisma.partyMember.findUnique({
      where: { partyId_userId: { partyId: party.id, userId: user.sub } },
    });
    if (membership?.role === PartyMemberRole.bartender) {
      return true;
    }

    const targetUserId: string | undefined = request.params.userId;
    if (targetUserId === user.sub && user.canCreateParty) {
      return true;
    }

    throw new ForbiddenException(
      'Only a bartender for this party can perform this action',
    );
  }
}
