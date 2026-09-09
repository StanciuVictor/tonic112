import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { HealthController } from './health/health.controller';
import { PartyModule } from './party/party.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, PartyModule, CatalogModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
