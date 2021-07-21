import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';

import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let databaseContainer: StartedTestContainer;

  beforeAll(async () => {
    databaseContainer = await new GenericContainer('postgres:13')
      .withExposedPorts(5432)
      .withTmpFs({ '/var/lib/postgresql/data': 'rw,noexec,nosuid,size=65536k' })
      .withWaitStrategy(
        Wait.forLogMessage('database system is ready to accept connections'),
      )
      .withEnv('POSTGRES_USER', 'bocachica')
      .withEnv('POSTGRES_DB', 'bocachica')
      .withEnv('POSTGRES_PASSWORD', 'bocachica')
      .start();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (databaseContainer) {
      await databaseContainer.stop();
    }
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
