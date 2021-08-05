import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { cpus } from 'os';

import { cluster, ProcessType, setProcessType } from './cluster';
import { AppModule } from './app.module';
import { WorkerModule } from './worker.module';
import { CORS_ORIGINS, PROCESS_RESPAWN_INTERVAL } from './config';
import { LoggingInterceptor } from './common/logging.interceptor';
import { flobj } from './common/string';

const logger = new Logger();

if (cluster.isMaster) {
  logger.log(`Master process started with PID ${process.pid}`);

  let numCPUs = cpus().length;

  // Spawn at least one worker
  spawnWorker();
  numCPUs--;

  // Spawn at least one web
  spawnWeb();
  numCPUs--;

  // If there are free CPUs left, spawn more web
  while (numCPUs-- > 0) {
    spawnWeb();
  }
} else {
  process.on('unhandledRejection', (error: Error) => {
    logger.error(`Unhandled Rejection: ${error.message} ${error.stack}`);
    process.exit(1);
  });

  cluster.worker.on('message', (data) => {
    if (data && data.type === ProcessType.Web) {
      setProcessType(ProcessType.Web);
      webBootstrap();
    } else {
      setProcessType(ProcessType.Worker);
      workerBootstrap();
    }
  });
}

function spawnWeb() {
  cluster
    .fork()
    .on('exit', (code, signal) => {
      logger.error(
        `Web process died, respawning... ${flobj({ code, signal })}`,
      );
      setTimeout(spawnWeb, PROCESS_RESPAWN_INTERVAL);
    })
    .send({ type: ProcessType.Web });
}

function spawnWorker() {
  cluster
    .fork()
    .on('exit', (code, signal) => {
      logger.error(
        `Worker process died, respawning... ${flobj({ code, signal })}`,
      );
      setTimeout(spawnWorker, PROCESS_RESPAWN_INTERVAL);
    })
    .send({ type: ProcessType.Worker });
}

async function webBootstrap() {
  logger.log(
    `Web process started ${flobj({
      pid: process.pid,
      wid: cluster.worker.id,
    })}`,
  );

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(helmet());
  if (CORS_ORIGINS.length) {
    app.enableCors({ origin: CORS_ORIGINS, credentials: true });
  }
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Boca Chica Backend')
    .setDescription('Boca Chica Backend API methods description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}

async function workerBootstrap() {
  logger.log(
    `Worker process started ${flobj({
      pid: process.pid,
      wid: cluster.worker.id,
    })}`,
  );

  const app = await NestFactory.create(WorkerModule);
  await app.init();
}
