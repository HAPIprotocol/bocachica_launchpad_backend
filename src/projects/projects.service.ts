import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindConditions, In, Not, Raw, Repository } from 'typeorm';
import { ParsedAccountData, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import * as BN from 'bn.js';
import { CronJob } from 'cron';

import { DEFAULT_ITEMS_PER_PAGE, ROUND_PENDING_CONCURRENCY } from '../config';
import {
  ProjectContribution,
  ProjectContributionStatus,
} from './entities/project-contribution.entity';
import { ProjectWithCurrentRound } from './dto/find-all-projects.dto';
import {
  ProjectRound,
  ProjectRoundAccessType,
  ProjectRoundAllocationType,
  ProjectRoundStatus,
} from './entities/project-round.entity';
import { Project } from './entities/project.entity';
import { SolanabeachService } from '../solanabeach/solanabeach.service';
import { flobj } from '../common/string';
import { TicketsService } from '../tickets/tickets.service';
import { Web3Connection, WEB3_CONNECTION } from '../web3/web3.module';
import { ContribCheckerService } from './contrib-checker.service';
import { collectedAmountSql } from './projects.sql';
import { getProcessType, ProcessType } from '../cluster';
import { ProjectParticipant } from './entities/project-participant.entity';
import { TransferInstruction } from '../solanabeach/interfaces';
import {
  retryUntilSuccess,
  RetryUntilSuccessStrategy,
  wait,
} from '../common/retry';
import { AccountsService } from '../accounts/accounts.service';

@Injectable()
export class ProjectsService implements OnModuleInit {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(ProjectContribution)
    private readonly contribRepo: Repository<ProjectContribution>,
    @InjectRepository(ProjectRound) private roundRepo: Repository<ProjectRound>,
    @InjectRepository(ProjectParticipant)
    private readonly participantRepo: Repository<ProjectParticipant>,
    private readonly solanabeach: SolanabeachService,
    private readonly ticketsService: TicketsService,
    @Inject(WEB3_CONNECTION)
    private readonly web3: Web3Connection,
    @Inject(forwardRef(() => ContribCheckerService))
    private readonly contribChecker: ContribCheckerService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly accountsService: AccountsService,
  ) {}

  onModuleInit() {
    if (getProcessType() === ProcessType.Worker) {
      {
        this.logger.log(`Starting cron job triggerActiveRoundsByTime`);

        const job = new CronJob(CronExpression.EVERY_10_SECONDS, async () => {
          await this.triggerActiveRoundsByTime();
        });

        this.schedulerRegistry.addCronJob('triggerActiveRoundsByTime', job);
        job.start();
      }

      {
        this.logger.log(`Starting cron job triggerPendingRoundsByTime`);

        const job = new CronJob(CronExpression.EVERY_10_SECONDS, async () => {
          await this.triggerPendingRoundsByTime();
        });

        this.schedulerRegistry.addCronJob('triggerPendingRoundsByTime', job);
        job.start();
      }

      {
        this.logger.log(`Starting cron job triggerRoundsByAmount`);

        const job = new CronJob(CronExpression.EVERY_10_SECONDS, async () => {
          await this.triggerRoundsByAmount();
        });

        this.schedulerRegistry.addCronJob('triggerRoundsByAmount', job);
        job.start();
      }
    }
  }

  async findAll(skip = 0, take = DEFAULT_ITEMS_PER_PAGE) {
    const [list, total] = await this.projectRepo.findAndCount({
      order: { id: 'ASC' },
      skip: skip > 0 ? skip : 0,
      take,
    });

    const promises: Promise<void>[] = [];
    for (const project of list as ProjectWithCurrentRound[]) {
      promises.push(
        this.roundRepo
          .findOne({
            where: {
              projectId: project.id,
              status: Not(ProjectRoundStatus.Finished),
            },
            order: { startDate: 'ASC' },
          })
          .then((round) => {
            project.currentRound = round;
          }),
      );
    }
    await Promise.all(promises);

    return { list, total };
  }

  async findOne(id: number) {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['rounds', 'partners'],
    });

    if (!project) {
      throw new NotFoundException();
    }

    return project;
  }

  async getContrib(publicKey: string, roundId: number) {
    const round = await this.roundRepo.findOne({ id: roundId });

    const { amount } = await this.contribRepo
      .createQueryBuilder()
      .select('SUM(amount)', 'amount')
      .where({ publicKey, roundId })
      .getRawOne();

    if (Number(amount) < Number(round.minAmount)) {
      return 0;
    }

    if (!round.solPowerScaling && Number(amount) > Number(round.maxAmount)) {
      return round.maxAmount;
    }

    return amount;
  }

  async getRoundInfo(roundId: number) {
    return this.roundRepo.findOne({
      where: { id: roundId },
      relations: ['project'],
    });
  }

  async fetchContribution(
    round: ProjectRound,
    txHash: string,
  ): Promise<{ total: string } | undefined> {
    const tokenAddress = await round.tokenAddress();

    this.logger.verbose(
      `Checking round contribution ${flobj({
        roundId: round.id,
        address: round.address,
        tokenAddress: tokenAddress.toString(),
        txHash,
      })}`,
    );

    const existingContrib = await this.contribRepo.findOne({
      where: { roundId: round.id, txHash },
    });

    if (
      existingContrib &&
      existingContrib.status !== ProjectContributionStatus.Pending
    ) {
      this.logger.verbose(
        `Contribution already finalized ${flobj({
          roundId: round.id,
          txHash,
        })}`,
      );

      return { total: existingContrib.amount };
    }

    const transaction = await retryUntilSuccess(
      () => {
        this.logger.debug(`Fetching transaction ${flobj({ txHash })}`);
        return this.solanabeach.getTransaction(txHash);
      },
      {
        strategy: RetryUntilSuccessStrategy.Exponential,
        maxAttempts: 5,
        interval: 1000,
        timeout: 60000,
        onErrorRetry: (error) => {
          this.logger.debug(
            `Couldn't fetch transaction ${flobj({
              txHash,
              error: error.message,
            })}`,
          );
          return true;
        },
      },
    );

    if (!transaction.valid) {
      this.logger.warn(
        `Transaction is not valid ${flobj({ roundId: round.id, txHash })}`,
      );
      return;
    }

    const transfers = transaction.instructions
      .filter((i) => i.programId.address === TOKEN_PROGRAM_ID.toString())
      .filter((i) => i.parsed['Transfer'])
      .map((i) => (i.parsed as TransferInstruction).Transfer)
      .filter(
        (transfer) =>
          transfer.destination.address === tokenAddress.toString() &&
          transfer.mint.address === round.smartcontractAddress,
      );

    if (transfers.length) {
      this.logger.verbose(
        `Found transfers ${flobj({
          roundId: round.id,
          count: transfers.length,
          txHash,
        })}`,
      );
    }

    let total = new BN(0);

    for (const transfer of transfers) {
      const tokenAccount = transfer.source.address;
      let publicKey: string;

      if (transfer.mint.address != round.smartcontractAddress) {
        this.logger.debug(
          `Irrelevant mint address ${flobj({
            roundId: round.id,
            mint: transfer.mint.address,
            address: round.smartcontractAddress,
            tokenAccount,
            txHash,
          })}`,
        );
        continue;
      }

      try {
        const data = await this.web3.getParsedAccountInfo(
          new PublicKey(tokenAccount),
        );

        publicKey = (data.value.data as ParsedAccountData).parsed.info.owner;
      } catch (_) {
        this.logger.error(
          `Couldn't fetch token account data ${flobj({
            tokenAccount,
            txHash,
            amount: transfer.amount,
          })}`,
        );
      }

      const logobj = {
        tokenAccount,
        publicKey,
        txHash,
        amount: transfer.amount,
      };

      const timestamp = new Date(transaction.blocktime.absolute * 1000);

      const rogue = await this.contribRepo.findOne({
        txHash,
        publicKey: Not(publicKey),
        status: ProjectContributionStatus.Pending,
      });
      if (rogue) {
        rogue.status = ProjectContributionStatus.Failure;
        await this.contribRepo.save(rogue);
        this.logger.warn(
          `Found rogue contrib ${flobj({
            ...logobj,
            rogueKey: rogue.publicKey,
          })}`,
        );
      }

      const existing = await this.contribRepo.findOne({
        where: { publicKey, txHash },
      });
      if (existing && existing.status !== ProjectContributionStatus.Pending) {
        this.logger.warn(`Duplicate contrib ignored ${flobj(logobj)}`);
      } else if (existing) {
        existing.timestamp = timestamp;
        existing.status = ProjectContributionStatus.Success;
        existing.amount = transfer.amount.toString();
        existing.blocknumber = transaction.blockNumber;
        await this.contribRepo.save(existing);
        this.logger.log(`Updated contrib ${flobj(logobj)}`);
        total = total.add(new BN(existing.amount));
      } else {
        const contrib = new ProjectContribution();
        contrib.roundId = round.id;
        contrib.publicKey = publicKey;
        contrib.blocknumber = transaction.blockNumber;
        contrib.timestamp = new Date(transaction.blocktime.absolute * 1000);
        contrib.amount = transfer.amount.toString();
        contrib.txHash = txHash;
        contrib.status = ProjectContributionStatus.Success;
        await this.contribRepo.save(contrib);
        this.logger.log(`Created contrib ${flobj(logobj)}`);
        total = total.add(new BN(contrib.amount));
      }
    }

    return { total: total.toString() };
  }

  async fetchContributions(
    round: ProjectRound,
    force = false,
  ): Promise<{ total: string }> {
    const tokenAddress = await round.tokenAddress();

    this.logger.verbose(
      `Checking round contributions ${flobj({
        roundId: round.id,
        address: round.address,
        tokenAddress: tokenAddress.toString(),
      })}`,
    );

    const { amount } = await this.contribRepo
      .createQueryBuilder()
      .select('SUM(amount)', 'amount')
      .where({ roundId: round.id })
      .getRawOne();

    let total = new BN(amount || 0);

    if (amount !== undefined && amount > 0) {
      this.logger.verbose(
        `Historical round contributions ${flobj({
          roundId: round.id,
          address: round.address,
          tokenAddress: tokenAddress.toString(),
          amount,
        })}`,
      );
    }

    const latestContrib = await this.contribRepo.findOne({
      where: { roundId: round.id },
      order: { blocknumber: 'DESC' },
    });

    if (latestContrib) {
      this.logger.verbose(
        `Latest contribution ${flobj({
          roundId: round.id,
          address: round.address,
          tokenAddress: tokenAddress.toString(),
          blocknumber: latestContrib.blocknumber,
          timestamp: latestContrib.timestamp.toISOString(),
        })}`,
      );
    }

    const limit = 10;
    let offset = 0;

    while (true) {
      const transfers = await this.solanabeach.getTokenTransfers(
        tokenAddress.toString(),
        limit,
        offset,
        undefined,
        false,
      );

      if (!transfers.length) {
        this.logger.debug(
          `Empty transfers page ${flobj({
            roundId: round.id,
            tokenAddress: tokenAddress.toString(),
            limit,
            offset,
          })}`,
        );
        break;
      }

      this.logger.verbose(
        `Found transfers ${flobj({
          roundId: round.id,
          count: transfers.length,
          offset,
          tokenAddress: tokenAddress.toString(),
        })}`,
      );

      // Historic data?
      if (
        !force &&
        transfers[0] &&
        latestContrib &&
        transfers[0].blocknumber <= latestContrib.blocknumber
      ) {
        this.logger.debug(
          `Reached historic data ${flobj({
            roundId: round.id,
            offset,
            limit,
            tokenAddress: tokenAddress.toString(),
            transferBlocknumber: transfers[0].blocknumber,
            latestBlocknumber: latestContrib.blocknumber,
          })}`,
        );
        break;
      }

      for (const transfer of transfers) {
        const tokenAccount = transfer.source.address;
        const txHash = transfer.txhash;
        let publicKey: string;

        if (transfer.mint.address != round.smartcontractAddress) {
          this.logger.debug(
            `Irrelevant mint address ${flobj({
              roundId: round.id,
              mint: transfer.mint.address,
              address: round.smartcontractAddress,
              tokenAccount,
            })}`,
          );
          continue;
        }

        try {
          const data = await this.web3.getParsedAccountInfo(
            new PublicKey(tokenAccount),
          );

          publicKey = (data.value.data as ParsedAccountData).parsed.info.owner;
        } catch (_) {
          this.logger.error(
            `Couldn't fetch token account data ${flobj({
              tokenAccount,
              txHash,
              amount: transfer.amount,
            })}`,
          );
        }

        const logobj = {
          tokenAccount,
          publicKey,
          txHash,
          amount: transfer.amount,
        };

        //// Destination address is a token account, not round collection address
        // if (transfer.destination.address !== round.address) {
        //   this.logger.debug(`Invalid destination ${flobj(logobj)}`);
        //   continue;
        // }

        if (!transfer.valid) {
          this.logger.debug(`Invalid contrib ${flobj(logobj)}`);
          continue;
        }

        const existing = await this.contribRepo.findOne({
          where: { publicKey, txHash },
        });
        if (existing) {
          this.logger.warn(`Duplicate contrib ${flobj(logobj)}`);
          continue;
        }

        const contrib = new ProjectContribution();
        contrib.roundId = round.id;
        contrib.publicKey = publicKey;
        contrib.blocknumber = transfer.blocknumber;
        contrib.timestamp = new Date(transfer.timestamp.absolute * 1000);
        contrib.amount = transfer.amount.toString();
        contrib.txHash = transfer.txhash;
        await this.contribRepo.save(contrib);
        this.logger.log(`Saved contrib ${flobj(logobj)}`);
        total = total.add(new BN(contrib.amount));
      }

      // Last page?
      if (transfers.length < limit) {
        this.logger.debug(
          `Reached last transfers page ${flobj({
            roundId: round.id,
            tokenAddress: tokenAddress.toString(),
            limit,
            offset,
          })}`,
        );
        break;
      }

      if (force) {
        await wait(5000);
      }

      offset += limit;
    }

    const collectedAmount = await this.updateCollectedAmount(round.id);

    this.logger.log(
      `Fetched round contributions ${flobj({
        roundId: round.id,
        total: total.toString(),
        collectedAmount,
      })}`,
    );

    return { total: total.toString() };
  }

  async getActiveRounds() {
    return this.roundRepo.find({
      where: { status: ProjectRoundStatus.Active },
    });
  }

  async findAllRounds(filters: {
    skip: number;
    take: number;
    accessType?: ProjectRoundAccessType;
    status: ProjectRoundStatus;
    publicKey?: string;
    query?: string;
  }) {
    if (filters.take > 10) {
      filters.take = 10;
    }

    const where: FindConditions<ProjectRound> = {};

    if (filters.publicKey) {
      let publicKey: PublicKey;
      try {
        publicKey = new PublicKey(filters.publicKey);
      } catch (_) {
        return { list: [], total: 0 };
      }

      if (publicKey) {
        const roundIds = await this.ticketsService.getRoundsForPubkey(
          filters.publicKey,
        );
        where.id = In(roundIds);
      }
    }

    if (filters.status && filters.status != ProjectRoundStatus.Hidden) {
      where.status = filters.status;
    } else {
      where.status = Not(ProjectRoundStatus.Hidden);
    }

    if (filters.accessType) {
      where.accessType = filters.accessType;
    }

    let list: ProjectRound[];
    let total: number;

    if (filters.query) {
      const qb = this.roundRepo
        .createQueryBuilder('r')
        .leftJoinAndSelect('r.project', 'project')
        .where(where)
        .andWhere(
          `(project.title LIKE '%${filters.query}%' OR project.ticker LIKE '%${filters.query}%' OR r.name LIKE '%${filters.query}%' OR r.currency LIKE '%${filters.query}')`,
        )
        .skip(filters.skip > 0 ? filters.skip : 0)
        .take(filters.take);

      [list, total] = await qb.getManyAndCount();
    } else {
      [list, total] = await this.roundRepo.findAndCount({
        order: { startDate: 'DESC' },
        where,
        skip: filters.skip > 0 ? filters.skip : 0,
        take: filters.take,
        relations: ['project'],
      });
    }

    return { list, total };
  }

  async findOneRound(id: number) {
    const round = await this.roundRepo.findOne({
      where: { id, status: Not(ProjectRoundStatus.Hidden) },
      relations: ['project', 'project.partners'],
    });

    if (!round) {
      throw new NotFoundException();
    }

    return round;
  }

  async updateTotalSupply(id: number, lamports: string) {
    await this.projectRepo.update({ id }, { totalSupply: lamports });
  }

  async projectsToUpdateTotalSupply(): Promise<Project[]> {
    return this.projectRepo.find();
  }

  async reportContribution(
    publicKey: string,
    txHash: string,
    roundId: number,
    amount: string,
  ): Promise<void> {
    try {
      await this.roundRepo.findOneOrFail({ id: roundId }, { cache: 60000 });

      let contrib = await this.contribRepo.findOne({ roundId, txHash });
      if (!contrib) {
        contrib = new ProjectContribution();
        contrib.roundId = roundId;
        contrib.publicKey = publicKey;
        contrib.amount = amount;
        contrib.txHash = txHash;
        contrib.status = ProjectContributionStatus.Pending;
        await this.contribRepo.save(contrib);
      }

      const tx = await this.web3.getTransaction(txHash, {
        commitment: 'confirmed',
      });
      if (tx) {
        await this.contribChecker.updateRoundContribution(roundId, txHash);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to report contribution ${flobj({
          txHash,
          roundId,
          amount,
          error: error.toString(),
        })}`,
      );
    }
  }

  async updateCollectedAmount(roundId: number) {
    const [row] = await this.roundRepo.query(collectedAmountSql, [roundId]);

    const { amount } = row;

    await this.roundRepo.update({ id: roundId }, { collectedAmount: amount });

    return amount;
  }

  async triggerRoundsByAmount() {
    const rounds = await this.roundRepo.find({
      where: {
        status: ProjectRoundStatus.Active,
        allocationType: ProjectRoundAllocationType.Amount,
        targetAmount: Raw((col) => `${col} < "collectedAmount"`),
      },
    });

    for (const round of rounds) {
      this.logger.log(
        `Round has reached the target amount ${flobj({
          roundId: round.id,
          targetAmount: round.targetAmount,
          collectedAmount: round.collectedAmount,
        })}`,
      );

      round.status = ProjectRoundStatus.Finished;

      await this.roundRepo.save(round);
    }
  }

  async triggerActiveRoundsByTime() {
    const rounds = await this.roundRepo.find({
      where: {
        status: ProjectRoundStatus.Active,
        endDate: Raw((col) => `${col} < NOW()`),
      },
    });

    for (const round of rounds) {
      this.logger.log(
        `Round has reached the end date ${flobj({
          roundId: round.id,
          targetAmount: round.targetAmount,
          collectedAmount: round.collectedAmount,
          endDate: round.endDate.toString(),
        })}`,
      );
      round.status = ProjectRoundStatus.Finished;
      await this.roundRepo.save(round);
    }
  }

  async triggerPendingRoundsByTime() {
    const rounds = await this.roundRepo.find({
      where: {
        status: ProjectRoundStatus.Pending,
        startDate: Raw((col) => `${col} < NOW()`),
      },
    });

    for (const round of rounds) {
      this.logger.log(
        `Round has reached the start date ${flobj({
          roundId: round.id,
          targetAmount: round.targetAmount,
          startDate: round.startDate.toString(),
        })}`,
      );
      round.status = ProjectRoundStatus.Active;
      await this.roundRepo.save(round);
    }
  }

  async isWhitelisted(roundId: number, publicKey: string): Promise<boolean> {
    const participant = await this.participantRepo.findOne({
      roundId,
      publicKey,
    });

    if (!participant) {
      return false;
    }

    return true;
  }

  async canContribute(roundId: number, publicKey: string): Promise<boolean> {
    try {
      const round = await this.roundRepo.findOne(
        { id: roundId },
        { cache: 60000 },
      );

      // Round is not active
      if (round.status !== ProjectRoundStatus.Active) {
        return false;
      }

      const collectedAmount = new BN(round.collectedAmount);
      const targetAmount = new BN(round.targetAmount);

      // Target amount is already collected
      if (collectedAmount.gte(targetAmount)) {
        return false;
      }

      // Not on a whitelist for the private round
      if (round.accessType === ProjectRoundAccessType.Private) {
        const isWhitelisted = await this.isWhitelisted(roundId, publicKey);
        if (!isWhitelisted) {
          return false;
        }
      }

      // Too many people are contributing at once
      const pendingCount = await this.contribRepo.count({
        where: {
          roundId,
          status: ProjectContributionStatus.Pending,
        },
        cache: 1000,
      });
      if (pendingCount > ROUND_PENDING_CONCURRENCY) {
        return false;
      }

      // Pending contribution already exists
      const contrib = await this.contribRepo.findOne(
        { roundId, publicKey },
        { cache: 1000 },
      );
      if (contrib && contrib.status === ProjectContributionStatus.Pending) {
        return false;
      } else if (contrib) {
        const { amount } = await this.contribRepo
          .createQueryBuilder('c')
          .select('SUM(c.amount)', 'amount')
          .where({
            roundId,
            publicKey,
            status: Not(ProjectContributionStatus.Failure),
          })
          .groupBy('c.publicKey')
          .cache(1000)
          .getRawOne();

        const contributedAmount = new BN(amount);
        let maxAmount = new BN(round.maxAmount);

        if (round.solPowerCheck) {
          const solPowerAmount = new BN(
            await this.accountsService.getAccountSolPower(publicKey),
          );

          maxAmount = maxAmount
            .muln(round.solPowerRate || 1)
            .mul(solPowerAmount);
        }

        if (contributedAmount.gte(maxAmount)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.warn(
        `Failed to check can contribute ${flobj({
          roundId,
          publicKey,
          error: error.message,
        })}`,
      );
      return false;
    }
  }
}
