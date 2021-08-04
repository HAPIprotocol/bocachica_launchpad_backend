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

  jest.setTimeout(30000);

  beforeAll(async () => {
    [redisContainer, pgContainer] = await Promise.all([
      createRedisContainer(),
      createPostgresContainer(),
    ]);

    (config as any).QUEUE_REDIS_URL = redisContainer.connectionString();

    jest.setTimeout(5000);
  });

  afterAll(async () => {
    await Promise.all([app.close(), redisContainer.stop(), pgContainer.stop()]);
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AccountsModule, pgContainer.module()],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('/accounts/:address/balance (GET)', async () => {
    return request(app.getHttpServer())
      .get('/accounts/7jkywwRB2TCnXw3FNa2B6KXtRt686gBHB4W6yJQvKVcx/balance')
      .expect(200)
      .expect({ balance: '17172794999' });
  });
});
