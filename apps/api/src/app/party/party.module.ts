import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BartenderGuard } from './guards/bartender.guard';
import { PartyController } from './party.controller';
import { PartyService } from './party.service';

@Module({
  imports: [AuthModule],
  controllers: [PartyController],
  providers: [PartyService, BartenderGuard],
})
export class PartyModule {}
