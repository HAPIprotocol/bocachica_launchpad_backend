import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { ProjectsService } from './projects/projects.service';

async function fetchContributions(roundId: number) {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const round = await app.get(ProjectsService).findOneRound(roundId);
  await app.get(ProjectsService).fetchContributions(round, true);
}

const args = process.argv.slice(2);

if (args[0] === 'fetchContributions' && Number(args[1]) > 0) {
  fetchContributions(Number(args[1]));
}
