import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PartyController } from './party.controller';
import { PartyService } from './party.service';

@Module({
  imports: [AuthModule],
  controllers: [PartyController],
  providers: [PartyService],
})
export class PartyModule {}
