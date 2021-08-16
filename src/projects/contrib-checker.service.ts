import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import * as Queue from 'bee-queue';
import { CronJob } from 'cron';

import { Web3Connection, WEB3_CONNECTION } from '../web3/web3.module';
import { flobj } from '../common/string';
import { QUEUE_REDIS_URL } from '../config';
import { ProjectsService } from './projects.service';
import { getProcessType, ProcessType } from '../cluster';

export interface ContribCheckerJob {
  roundId: number;
}

const CONTRIB_CHECKER_JOB_CONCURRENCY = 10;

@Injectable()
export class ContribCheckerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ContribCheckerService.name);
  public readonly queue: Queue<ContribCheckerJob>;
  private roundSubs: number[] = [];

  constructor(
    private readonly projectsService: ProjectsService,
    @Inject(WEB3_CONNECTION)
    private readonly web3: Web3Connection,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    if (getProcessType() === ProcessType.Web) {
      const queue = new Queue(ContribCheckerService.name, {
        redis: QUEUE_REDIS_URL,
        isWorker: false,
      });

      this.queue = queue;
    } else {
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

      {
        this.logger.log(`Starting cron job checkRoundContributions`);

        const job = new CronJob(CronExpression.EVERY_10_MINUTES, async () => {
          await this.checkRoundContributions();
        });

        this.schedulerRegistry.addCronJob('checkRoundContributions', job);
        job.start();
      }

      {
        this.logger.log(`Starting cron job subscribeForRounds`);

        const job = new CronJob(CronExpression.EVERY_10_MINUTES, async () => {
          await this.subscribeForRounds();
        });

        this.schedulerRegistry.addCronJob('subscribeForRounds', job);
        job.start();
      }
    }
  }

  async checkRoundContributions() {
    const rounds = await this.projectsService.getActiveRounds();
    this.logger.log(
      `Checking round contributions ${flobj({ count: rounds.length })}`,
    );
    for (const round of rounds) {
      this.logger.verbose(
        `Checking round contributions ${flobj({
          roundId: round.id,
          address: round.address,
        })}`,
      );
      await this.updateRoundContribution(round.id);
    }
  }

  async subscribeForRounds() {
    this.logger.debug(
      `Cleaning round account subscriptions ${flobj({
        count: this.roundSubs.length,
      })}`,
    );
    for (const subId of this.roundSubs) {
      try {
        await this.web3.removeAccountChangeListener(subId);
      } catch (_) {
        this.logger.warn(
          `Can't remove account change listener ${flobj({ subId })}`,
        );
      }
    }
    this.roundSubs = [];

    const rounds = await this.projectsService.getActiveRounds();
    for (const round of rounds) {
      const tokenAddress = await round.tokenAddress();

      this.logger.log(
        `Subscribing to round address updated ${flobj({
          roundId: round.id,
          address: round.address,
          tokenAddress: tokenAddress.toString(),
        })}`,
      );

      const subId = this.web3.onAccountChange(tokenAddress, async () => {
        this.logger.log(
          `Round address updated ${flobj({
            roundId: round.id,
            address: round.address,
            tokenAddress: tokenAddress.toString(),
          })}`,
        );
        await this.updateRoundContribution(round.id);
      });
      this.roundSubs.push(subId);
    }
  }

  async onModuleInit() {
    await this.queue.ready();
    if (getProcessType() === ProcessType.Worker) {
      await this.checkRoundContributions();
      await this.subscribeForRounds();
    }
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
