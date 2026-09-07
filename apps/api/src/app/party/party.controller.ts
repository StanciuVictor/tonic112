import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  GuestJoinResponse,
  PartyDto,
  PartyMemberDto,
} from '@tonic112/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RequireFlags } from '../auth/decorators/require-flags.decorator';
import { FlagsGuard } from '../auth/guards/flags.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { JoinGuestDto } from './dto/join-guest.dto';
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
}
