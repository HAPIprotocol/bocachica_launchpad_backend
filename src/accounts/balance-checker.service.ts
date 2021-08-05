import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Connection, PublicKey } from '@solana/web3.js';
import * as Queue from 'bee-queue';
import * as BN from 'bn.js';
import { getProcessType, ProcessType } from 'src/cluster';

import {
  BALANCE_CHECKER_JOB_CONCURRENCY,
  QUEUE_REDIS_URL,
  SOLANA_ENDPOINT_URL,
} from '../config';
import { AccountsService } from './accounts.service';

export interface BalanceCheckerJob {
  address: string;
}

@Injectable()
export class BalanceCheckerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BalanceCheckerService.name);

  public readonly queue: Queue<BalanceCheckerJob>;
  public readonly solana: Connection;

  constructor(private readonly accountsService: AccountsService) {
    this.solana = new Connection(SOLANA_ENDPOINT_URL, 'finalized');

    if (getProcessType() === ProcessType.Web) {
      const queue = new Queue(BalanceCheckerService.name, {
        redis: QUEUE_REDIS_URL,
        isWorker: false,
      });

      this.queue = queue;
    } else {
      const queue = new Queue(BalanceCheckerService.name, {
        redis: QUEUE_REDIS_URL,
      });

      queue.process(BALANCE_CHECKER_JOB_CONCURRENCY, async (job) => {
        const address = job.data.address;
        const lamports = await this.solana.getBalance(new PublicKey(address));

        await this.accountsService.updateBalance(address, lamports);

        return new BN(lamports).toString();
      });

      queue.on('ready', () => {
        this.logger.log(`Queue is ready`);
      });

      queue.on('error', (err) => {
        this.logger.error(err.message);
      });

      queue.on('job succeeded', (jobId, result) => {
        this.logger.debug(`Job succeeded id=${jobId} balance=${result}`);
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
  }

  async onModuleInit() {
    await this.queue.ready();
  }

  async onModuleDestroy() {
    await this.queue.close();
  }

  async getBalance(address: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const job = await this.queue
        .createJob({ address })
        .timeout(1000)
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
