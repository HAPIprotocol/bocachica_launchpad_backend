import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as Queue from 'bee-queue';

import { flobj } from '../common/string';
import { QUEUE_REDIS_URL } from '../config';
import { ProjectsService } from './projects.service';

export interface ContribCheckerJob {
  roundId: number;
}

const CONTRIB_CHECKER_JOB_CONCURRENCY = 10;

@Injectable()
export class ContribCheckerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ContribCheckerService.name);
  public readonly queue: Queue<ContribCheckerJob>;

  constructor(private readonly projectsService: ProjectsService) {
    const queue = new Queue(ContribCheckerService.name, {
      redis: QUEUE_REDIS_URL,
    });

    queue.process(CONTRIB_CHECKER_JOB_CONCURRENCY, async (job) => {
      const { roundId } = job.data;

      const round = await this.projectsService.getRoundInfo(roundId);

      if (!round) {
        throw new Error(`Round not found: ${roundId}`);
      }

      await this.projectsService.fetchContributions(round);
    });

    queue.on('ready', () => {
      this.logger.log(`Queue is ready`);
    });

    queue.on('error', (err) => {
      this.logger.error(err.message);
    });

    queue.on('job succeeded', (jobId, result) => {
      this.logger.debug(`Job succeeded id=${jobId} total=${result}`);
    });

    queue.on('job retrying', (jobId, error) => {
      this.logger.debug(
        `Job retrying id=${jobId} err=${JSON.stringify(error.message)}`,
      );
    });

    queue.on('job failed', (jobId, error) => {
      this.logger.error(
        `Job failed id=${jobId} err=${JSON.stringify(error.message)}`,
      );
    });

    queue.on('job progress', (jobId, progress) => {
      this.logger.debug(`Job progress id=${jobId} progress=${progress}`);
    });

    this.queue = queue;
  }

  async onModuleInit() {
    await this.queue.ready();
  }

  async onModuleDestroy() {
    await this.queue.close();
  }

  async updateRoundContribution(roundId: number): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const job = await this.queue
        .createJob({ roundId })
        .timeout(60000)
        .retries(3)
        .backoff('exponential', 1000)
        .save();

      job.on('succeeded', (result) => {
        resolve(result);
      });

      job.on('failed', (err) => {
        reject(err);
      });

      this.logger.debug(
        `Job started ${flobj({ id: job.id, roundId: job.data.roundId })}`,
      );
    });
  }
}
