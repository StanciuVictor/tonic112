import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import {
  GuestJoinResponse,
  GuestParticipantDto,
  MemberParticipantDto,
  ParticipantDto,
  ParticipantKind,
  PartyDto,
  PartyMemberDto,
} from '@tonic112/shared-types';
import { AuthRole } from '../auth/interfaces/auth-role';
import { PartyGuestJwtPayload } from '../auth/interfaces/party-guest-jwt-payload.interface';
import {
  Party,
  PartyMember,
  PartyMemberRole,
  PartyStatus,
  Prisma,
} from '../../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { generatePartyCode, generateQrToken } from './utils/party-code.util';

const MAX_CODE_GENERATION_ATTEMPTS = 5;
const GUEST_JWT_EXPIRES_IN = process.env.GUEST_JWT_EXPIRES_IN || '12h';

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

@Injectable()
export class PartyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async create(creatorUserId: string): Promise<PartyDto> {
    for (let attempt = 1; attempt <= MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
      try {
        const party = await this.prisma.$transaction(async (tx) => {
          const created = await tx.party.create({
            data: {
              code: generatePartyCode(),
              qrToken: generateQrToken(),
              createdByUserId: creatorUserId,
            },
          });
          await tx.partyMember.create({
            data: {
              partyId: created.id,
              userId: creatorUserId,
              role: PartyMemberRole.bartender,
            },
          });
          return created;
        });
        return this.toDto(party);
      } catch (error) {
        if (
          isUniqueConstraintViolation(error) &&
          attempt < MAX_CODE_GENERATION_ATTEMPTS
        ) {
          continue;
        }
        throw error;
      }
    }
    throw new Error('Could not generate a unique party code');
  }

  async findByCode(code: string): Promise<PartyDto> {
    const party = await this.findPartyByCode(code, {
      requireActive: false,
    });
    return this.toDto(party);
  }

  async joinAsGuest(
    code: string,
    guestName: string,
  ): Promise<GuestJoinResponse> {
    const party = await this.findPartyByCode(code);

    const guest = await this.prisma.partyGuest.create({
      data: { partyId: party.id, guestName },
    });

    const payload: PartyGuestJwtPayload = {
      role: AuthRole.guest,
      partyId: party.id,
      guestId: guest.id,
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: GUEST_JWT_EXPIRES_IN as SignOptions['expiresIn'],
    });

    return {
      accessToken,
      guest: { id: guest.id, partyId: party.id, guestName: guest.guestName },
    };
  }

  async joinAsUser(code: string, userId: string): Promise<PartyMemberDto> {
    const party = await this.findPartyByCode(code);

    const member = await this.prisma.partyMember.upsert({
      where: { partyId_userId: { partyId: party.id, userId } },
      update: {},
      create: { partyId: party.id, userId, role: PartyMemberRole.customer },
    });

    return this.toMemberDto(member);
  }

  async end(code: string, userId: string): Promise<PartyDto> {
    const party = await this.findPartyByCode(code, {
      requireActive: false,
    });

    const membership = await this.prisma.partyMember.findUnique({
      where: { partyId_userId: { partyId: party.id, userId } },
    });
    if (!membership || membership.role !== PartyMemberRole.bartender) {
      throw new ForbiddenException(
        'Only a bartender for this party can end it',
      );
    }
    if (party.status === PartyStatus.ended) {
      throw new ConflictException('Party has already ended');
    }

    const ended = await this.prisma.party.update({
      where: { id: party.id },
      data: { status: PartyStatus.ended, endedAt: new Date() },
    });
    return this.toDto(ended);
  }

  async promote(code: string, targetUserId: string): Promise<PartyMemberDto> {
    const party = await this.findPartyByCode(code, { requireActive: false });

    const membership = await this.prisma.partyMember.findUnique({
      where: { partyId_userId: { partyId: party.id, userId: targetUserId } },
    });
    if (!membership) {
      throw new NotFoundException('This user has not joined the party');
    }
    if (membership.role === PartyMemberRole.bartender) {
      return this.toMemberDto(membership);
    }

    const promoted = await this.prisma.partyMember.update({
      where: { id: membership.id },
      data: { role: PartyMemberRole.bartender, promotedAt: new Date() },
    });
    return this.toMemberDto(promoted);
  }

  async getMyMembership(code: string, userId: string): Promise<PartyMemberDto> {
    const party = await this.findPartyByCode(code, { requireActive: false });

    const membership = await this.prisma.partyMember.findUnique({
      where: { partyId_userId: { partyId: party.id, userId } },
    });
    if (!membership) {
      throw new NotFoundException('You have not joined this party');
    }
    return this.toMemberDto(membership);
  }

  async getParticipants(code: string): Promise<ParticipantDto[]> {
    const party = await this.findPartyByCode(code, { requireActive: false });

    const [members, guests] = await Promise.all([
      this.prisma.partyMember.findMany({
        where: { partyId: party.id },
        include: { user: { select: { name: true } } },
        orderBy: { joinedAt: 'asc' },
      }),
      this.prisma.partyGuest.findMany({
        where: { partyId: party.id },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const memberParticipants: MemberParticipantDto[] = members.map((m) => ({
      kind: ParticipantKind.member,
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      promotedAt: m.promotedAt?.toISOString() ?? null,
    }));
    const guestParticipants: GuestParticipantDto[] = guests.map((g) => ({
      kind: ParticipantKind.guest,
      id: g.id,
      guestName: g.guestName,
      joinedAt: g.createdAt.toISOString(),
    }));

    return [...memberParticipants, ...guestParticipants];
  }

  private async findPartyByCode(
    code: string,
    { requireActive = true }: { requireActive?: boolean } = {},
  ): Promise<Party> {
    const party = await this.prisma.party.findFirst({
      where: { OR: [{ code }, { qrToken: code }] },
    });
    if (!party) {
      throw new NotFoundException('Party not found');
    }
    if (requireActive && party.status !== PartyStatus.active) {
      throw new ConflictException('Party has ended');
    }
    return party;
  }

  private toMemberDto(member: PartyMember): PartyMemberDto {
    return {
      id: member.id,
      partyId: member.partyId,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      promotedAt: member.promotedAt?.toISOString() ?? null,
    };
  }

  private toDto(party: Party): PartyDto {
    return {
      id: party.id,
      code: party.code,
      status: party.status,
      createdByUserId: party.createdByUserId,
      createdAt: party.createdAt.toISOString(),
      startedAt: party.startedAt.toISOString(),
      endedAt: party.endedAt?.toISOString() ?? null,
      joinUrl: `${process.env.WEB_BASE_URL}/join?code=${party.qrToken}`,
    };
  }
}
