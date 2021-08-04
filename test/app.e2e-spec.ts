import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

import * as config from '../src/config';
import * as appModule from './../src/app.module';
import {
  ContainerHandle,
  createPostgresContainer,
  createRedisContainer,
} from './util/containers';

describe('App (e2e)', () => {
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
    (appModule as any).DatabaseConfigFactory = () => ({
      type: 'postgres',
      url: pgContainer.connectionString(),
      autoLoadEntities: true,
      synchronize: true,
    });

    jest.setTimeout(5000);
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [appModule.AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await redisContainer.stop();
    await pgContainer.stop();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });
});
