import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Connection } from '@solana/web3.js';
import * as Queue from 'bee-queue';

import {
  QUEUE_REDIS_URL,
  SOLANA_ENDPOINT_URL,
  SOLPOWER_CHECKER_JOB_CONCURRENCY,
} from '../config';
import { AccountsService } from './accounts.service';

export interface SolPowerCheckerJob {
  address: string;
}

@Injectable()
export class SolPowerCheckerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SolPowerCheckerService.name);

  public readonly queue: Queue<SolPowerCheckerJob>;
  public readonly solana: Connection;

  constructor(private readonly accountsService: AccountsService) {
    this.solana = new Connection(SOLANA_ENDPOINT_URL, 'finalized');

    const queue = new Queue(SolPowerCheckerService.name, {
      redis: QUEUE_REDIS_URL,
    });

    queue.process(SOLPOWER_CHECKER_JOB_CONCURRENCY, async (job) => {
      const address = job.data.address;

      const isExist = await this.accountsService.checkUserAccount(address);
      if (!isExist) {
        job.retries(0);
        throw new Error(`User address not found`);
      }

      try {
        const { lamports } = await this.accountsService.fetchStakeAccounts(
          address,
        );

        return lamports.toString();
      } catch (error) {
        throw error;
      }
    });

    queue.on('ready', () => {
      this.logger.log(`Queue is ready`);
    });

    queue.on('error', (err) => {
      this.logger.error(err.message);
    });

    queue.on('job succeeded', (jobId, result) => {
      this.logger.debug(`Job succeeded id=${jobId} SolPower=${result}`);
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

  async getSolPower(address: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const job = await this.queue
        .createJob({ address })
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

      this.logger.debug(`Job started id=${job.id} address=${job.data.address}`);
    });
  }
}
