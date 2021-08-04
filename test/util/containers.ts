import { DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenericContainer, Wait } from 'testcontainers';

export interface ContainerHandle {
  connectionString(): string;
  stop(): Promise<void>;
  module?(): DynamicModule;
}

export async function createRedisContainer(
  image = 'redis:6-alpine',
): Promise<ContainerHandle> {
  const container = await new GenericContainer(image)
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
    .start();

  return {
    connectionString() {
      const host = container.getHost();
      const port = container.getMappedPort(6379);
      return `redis://${host}:${port}`;
    },
    async stop() {
      if (container) await container.stop({ timeout: 100 });
    },
  };
}

export async function createPostgresContainer(
  image = 'postgres:13-alpine',
): Promise<ContainerHandle> {
  const container = await new GenericContainer(image)
    .withExposedPorts(5432)
    .withTmpFs({
      '/var/lib/postgresql/data': 'rw,noexec,nosuid,size=65536k',
    })
    .withStartupTimeout(10000)
    .withWaitStrategy(
      Wait.forLogMessage('database system is ready to accept connections'),
    )
    .withEnv('POSTGRES_USER', 'postgres')
    .withEnv('POSTGRES_DB', 'postgres')
    .withEnv('POSTGRES_PASSWORD', 'postgres')
    .start();

  const connectionString = () => {
    const host = container.getHost();
    const port = container.getMappedPort(5432);
    return `postgresql://postgres:postgres@${host}:${port}`;
  };

  return {
    connectionString,
    async stop() {
      if (container) await container.stop({ timeout: 100 });
    },
    module() {
      return TypeOrmModule.forRootAsync({
        useFactory: () => ({
          type: 'postgres',
          url: connectionString(),
          autoLoadEntities: true,
          synchronize: true,
          verboseRetryLog: false,
        }),
      });
    },
  };
}
