import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns an ok status with a timestamp', async () => {
    const result = await controller.getHealth();

    expect(result.status).toBe('ok');
    expect(typeof result.timestamp).toBe('string');
  });
});
