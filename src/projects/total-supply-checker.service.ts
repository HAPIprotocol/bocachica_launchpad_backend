import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import * as Queue from 'bee-queue';
import * as BN from 'bn.js';
import { CronJob } from 'cron';

import { Web3Connection, WEB3_CONNECTION } from '../web3/web3.module';
import { getProcessType, ProcessType } from '../cluster';
import {
  QUEUE_REDIS_URL,
  TOTAL_SUPPLY_CHECKER_JOB_CONCURRENCY,
} from '../config';
import { ProjectsService } from './projects.service';
import { flobj } from 'src/common/string';

export interface TotalSupplyCheckerJob {
  projectId: number;
}

@Injectable()
export class TotalSupplyCheckerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(TotalSupplyCheckerService.name);

  public readonly queue: Queue<TotalSupplyCheckerJob>;

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @Inject(WEB3_CONNECTION)
    private readonly web3: Web3Connection,
  ) {
    if (getProcessType() === ProcessType.Web) {
      const queue = new Queue(TotalSupplyCheckerService.name, {
        redis: QUEUE_REDIS_URL,
        isWorker: false,
      });

      this.queue = queue;
    } else {
      const queue = new Queue(TotalSupplyCheckerService.name, {
        redis: QUEUE_REDIS_URL,
      });

      queue.process(TOTAL_SUPPLY_CHECKER_JOB_CONCURRENCY, async (job) => {
        const projectId = job.data.projectId;

        const project = await this.projectsService.findOne(projectId);

        const {
          value: { amount },
        } = await this.web3.getTokenSupply(
          new PublicKey(project.smartContractAddress),
        );
        await this.projectsService.updateTotalSupply(projectId, amount);

        return new BN(amount).toString();
      });

      queue.on('ready', () => {
        this.logger.log(`Queue is ready`);
      });

      queue.on('error', (err) => {
        this.logger.error(err.message);
      });

      queue.on('job succeeded', (jobId, result) => {
        this.logger.debug(`Job succeeded id=${jobId} totalSupply=${result}`);
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
    if (getProcessType() === ProcessType.Worker) {
      this.logger.log(`Starting cron job updateProjectTotalSupplies`);

      const job = new CronJob(CronExpression.EVERY_HOUR, async () => {
        await this.updateProjectTotalSupplies();
      });

      await this.updateProjectTotalSupplies();

      this.schedulerRegistry.addCronJob('updateProjectTotalSupplies', job);
      job.start();
    }
  }

  async onModuleDestroy() {
    await this.queue.close();
  }

  async updateProjectTotalSupplies() {
    const projects = await this.projectsService.projectsToUpdateTotalSupply();
    this.logger.log('Started updating project total supplies');

    for (const project of projects) {
      const totalSupply = await this.getTotalSupply(project.id);
      await this.projectsService.updateTotalSupply(project.id, totalSupply);
      this.logger.verbose(
        `Updated total supply ${flobj({ projectId: project.id, totalSupply })}`,
      );
    }

    this.logger.log('Finished updating project total supplies');
  }

  async getTotalSupply(projectId: number): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const job = await this.queue
        .createJob({ projectId })
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

      this.logger.debug(
        `Job started id=${job.id} projectId=${job.data.projectId}`,
      );
    });
  }
}
