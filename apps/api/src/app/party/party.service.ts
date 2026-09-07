import { Injectable, NotFoundException } from '@nestjs/common';
import { PartyDto } from '@tonic112/shared-types';
import { Party, Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { generatePartyCode, generateQrToken } from './utils/party-code.util';

const MAX_CODE_GENERATION_ATTEMPTS = 5;

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

@Injectable()
export class PartyService {
  constructor(private readonly prisma: PrismaService) {}

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
              role: 'bartender',
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
    const party = await this.prisma.party.findFirst({
      where: { OR: [{ code }, { qrToken: code }] },
    });
    if (!party) {
      throw new NotFoundException('Party not found');
    }
    return this.toDto(party);
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
