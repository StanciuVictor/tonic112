import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { PartyModule } from './party/party.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, PartyModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
