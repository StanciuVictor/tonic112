import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PartyDto } from '@tonic112/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RequireFlags } from '../auth/decorators/require-flags.decorator';
import { FlagsGuard } from '../auth/guards/flags.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
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
}
