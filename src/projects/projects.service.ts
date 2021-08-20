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
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import * as BN from 'bn.js';
import { CronJob } from 'cron';

import { DEFAULT_ITEMS_PER_PAGE } from '../config';
import { ProjectContribution } from './entities/project-contribution.entity';
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

@Injectable()
export class ProjectsService implements OnModuleInit {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(ProjectContribution)
    private contribRepo: Repository<ProjectContribution>,
    @InjectRepository(ProjectRound) private roundRepo: Repository<ProjectRound>,
    @InjectRepository(ProjectParticipant)
    private participantRepo: Repository<ProjectParticipant>,
    private readonly solanabeach: SolanabeachService,
    private readonly ticketsService: TicketsService,
    @Inject(WEB3_CONNECTION)
    private readonly web3: Web3Connection,
    @Inject(forwardRef(() => ContribCheckerService))
    private readonly contribChecker: ContribCheckerService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    if (getProcessType() === ProcessType.Worker) {
      {
        this.logger.log(`Starting cron job triggerRoundsByTime`);

        const job = new CronJob(CronExpression.EVERY_10_SECONDS, async () => {
          await this.triggerRoundsByTime();
        });

        this.schedulerRegistry.addCronJob('triggerRoundsByTime', job);
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

  async fetchContributions(round: ProjectRound): Promise<{ total: string }> {
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

    if (filters.status) {
      where.status = filters.status;
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
          `project.title LIKE '%${filters.query}%' OR project.ticker LIKE '%${filters.query}%' OR r.name LIKE '%${filters.query}%' OR r.currency LIKE '%${filters.query}'`,
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
      where: { id },
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

  async reportContribution(txHash: string, roundId: number): Promise<void> {
    try {
      await this.roundRepo.findOneOrFail({ id: roundId }, { cache: 60000 });
      await this.web3.getTransaction(txHash, { commitment: 'confirmed' });
      await this.contribChecker.updateRoundContribution(roundId);
    } catch (error) {
      this.logger.warn(
        `Failed to report contribution ${flobj({
          txHash,
          roundId,
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

  async triggerRoundsByTime() {
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

  async isWhitelisted(roundId: number, publicKey: string): Promise<boolean> {
    const participant = await this.participantRepo.findOne({
      roundId,
      publicKey,
    });

    if (!participant) {
      throw new NotFoundException();
    }

    return true;
  }
}
