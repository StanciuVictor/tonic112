import { Controller, Get } from '@nestjs/common';
import { HealthResponse } from '@tonic112/shared-types';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  async getHealth(): Promise<HealthResponse> {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
