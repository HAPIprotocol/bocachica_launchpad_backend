import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';

import { AppModule } from './app.module';
import { CORS_ORIGINS } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(helmet());
  if (CORS_ORIGINS.length) {
    app.enableCors({ origin: CORS_ORIGINS, credentials: true });
  }

  const config = new DocumentBuilder()
    .setTitle('Boca Chica Backend')
    .setDescription('Boca Chica Backend API methods description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
