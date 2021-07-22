import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Connection } from '@solana/web3.js';
import * as Queue from 'bee-queue';
import * as BN from 'bn.js';

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

      const stakeAccounts = await this.accountsService.getStakeAccounts(
        address,
      );

      let lamports = new BN(0);

      for (const stakeAccount of stakeAccounts) {
        const stakeRewards = await this.accountsService.getStakeRewards(
          stakeAccount,
        );

        for (const stakeReward of stakeRewards) {
          const { reward } = stakeReward;
          lamports = lamports.add(new BN(reward));
        }
      }

      return lamports.toString();
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

  async getSolPower(address: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const job = await this.queue
        .createJob({ address })
        .timeout(1000)
        .retries(3)
        .backoff('exponential', 1000)
        .save();

      job.on('succeeded', (result) => {
        this.logger.verbose(
          `[Job ${job.id}] SolPower of ${address} is ${result}`,
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
