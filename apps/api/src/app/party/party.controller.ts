import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ActivePartyMembershipDto,
  GuestJoinResponse,
  ParticipantDto,
  PartyDto,
  PartyMemberDto,
} from '@tonic112/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RequireFlags } from '../auth/decorators/require-flags.decorator';
import { FlagsGuard } from '../auth/guards/flags.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { JoinGuestDto } from './dto/join-guest.dto';
import { BartenderGuard } from './guards/bartender.guard';
import { PartyService } from './party.service';

@Controller('parties')
export class PartyController {
  constructor(private readonly partyService: PartyService) {}

  @Post()
  @UseGuards(FlagsGuard)
  @RequireFlags('canCreateParty')
  create(@CurrentUser() user: JwtPayload): Promise<PartyDto> {
    return this.partyService.create(user.sub);
  }

  @Get('me/active')
  getMyActiveParty(
    @CurrentUser() user: JwtPayload,
  ): Promise<ActivePartyMembershipDto> {
    return this.partyService.getMyActiveParty(user.sub);
  }

  @Public()
  @Get(':code')
  findByCode(@Param('code') code: string): Promise<PartyDto> {
    return this.partyService.findByCode(code);
  }

  @Public()
  @Post(':code/join/guest')
  joinAsGuest(
    @Param('code') code: string,
    @Body() dto: JoinGuestDto,
  ): Promise<GuestJoinResponse> {
    return this.partyService.joinAsGuest(code, dto.guestName);
  }

  @Post(':code/join/user')
  joinAsUser(
    @Param('code') code: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PartyMemberDto> {
    return this.partyService.joinAsUser(code, user.sub);
  }

  @Post(':code/end')
  end(
    @Param('code') code: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PartyDto> {
    return this.partyService.end(code, user.sub);
  }

  @Get(':code/participants')
  @UseGuards(BartenderGuard)
  getParticipants(@Param('code') code: string): Promise<ParticipantDto[]> {
    return this.partyService.getParticipants(code);
  }

  @Get(':code/members/me')
  getMyMembership(
    @Param('code') code: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PartyMemberDto> {
    return this.partyService.getMyMembership(code, user.sub);
  }

  @Post(':code/members/:userId/promote')
  @UseGuards(BartenderGuard)
  promote(
    @Param('code') code: string,
    @Param('userId') userId: string,
  ): Promise<PartyMemberDto> {
    return this.partyService.promote(code, userId);
  }

  @Post(':code/members/me/demote')
  demoteSelf(
    @Param('code') code: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PartyMemberDto> {
    return this.partyService.demoteSelf(code, user.sub);
  }

  @Post(':code/leave')
  leave(
    @Param('code') code: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.partyService.leave(code, user.sub);
  }
}
