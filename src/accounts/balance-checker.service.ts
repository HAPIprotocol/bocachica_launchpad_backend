import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Connection, PublicKey } from '@solana/web3.js';
import * as Queue from 'bee-queue';

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

    const queue = new Queue(BalanceCheckerService.name, {
      redis: QUEUE_REDIS_URL,
    });

    queue.process(BALANCE_CHECKER_JOB_CONCURRENCY, async (job) => {
      const address = job.data.address;
      const lamports = await this.solana.getBalance(new PublicKey(address));

      await this.accountsService.updateBalance(address, lamports);

      return lamports;
    });

    queue.on('ready', () => {
      this.logger.log(`Queue is ready`);
    });

    queue.on('error', (err) => {
      this.logger.error(err.message);
    });

    this.queue = queue;
  }

  async onModuleInit() {
    await this.queue.ready();
  }

  async onModuleDestroy() {
    await this.queue.close();
  }

  async getBalance(address: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      const job = await this.queue
        .createJob({ address })
        .timeout(1000)
        .retries(3)
        .backoff('exponential', 1000)
        .save();

      job.on('succeeded', (result) => {
        this.logger.verbose(
          `[Job ${job.id}] Balance of ${address} is ${result}`,
        );
        resolve(result);
      });

      job.on('failed', (err) => {
        this.logger.warn(
          `[Job ${job.id}] Error for ${address} is ${err.message}`,
        );
        reject(err);
      });
    });
  }
}
