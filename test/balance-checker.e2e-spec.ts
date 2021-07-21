import { Test, TestingModule } from '@nestjs/testing';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';

import * as config from '../src/config';
import { BalanceCheckerService } from '../src/accounts/balance-checker.service';

describe('BalanceCheckerService', () => {
  let service: BalanceCheckerService;
  let redisContainer: StartedTestContainer;

  beforeAll(async () => {
    redisContainer = await new GenericContainer('redis:6')
      .withExposedPorts(6379)
      .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
      .start();

    (
      config as any
    ).QUEUE_REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(
      6379,
    )}`;
  });

  afterAll(async () => {
    if (redisContainer) {
      await redisContainer.stop();
    }
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BalanceCheckerService],
    }).compile();

    service = module.get<BalanceCheckerService>(BalanceCheckerService);

    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should check address balance', async () => {
    const address = '7jkywwRB2TCnXw3FNa2B6KXtRt686gBHB4W6yJQvKVcx';

    const balance = await service.getBalance(address);

    console.log({ balance });
  });
});
