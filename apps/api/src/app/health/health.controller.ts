import { Controller, Get } from '@nestjs/common';
import { HealthResponse } from '@bar-app/shared-types';

@Controller('health')
export class HealthController {
  @Get()
  async getHealth(): Promise<HealthResponse> {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
