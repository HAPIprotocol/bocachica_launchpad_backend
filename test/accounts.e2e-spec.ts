import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import * as config from '../src/config';
import {
  ContainerHandle,
  createPostgresContainer,
  createRedisContainer,
} from './util/containers';
import { AccountsModule } from '../src/accounts/accounts.module';

describe('Accounts', () => {
  let app: INestApplication;
  let redisContainer: ContainerHandle;
  let pgContainer: ContainerHandle;

  beforeAll(async () => {
    [redisContainer, pgContainer] = await Promise.all([
      createRedisContainer(),
      createPostgresContainer(),
    ]);

    (config as any).QUEUE_REDIS_URL = redisContainer.connectionString();
  });

  afterAll(async () => {
    await Promise.all([redisContainer.stop(), pgContainer.stop()]);
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [pgContainer.module(), AccountsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('/accounts/:address/balance (GET)', () => {
    return request(app.getHttpServer())
      .get('/accounts/7jkywwRB2TCnXw3FNa2B6KXtRt686gBHB4W6yJQvKVcx/balance')
      .expect(200)
      .expect({ balance: 1 });
  });
});
