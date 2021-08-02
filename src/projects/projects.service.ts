import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOperator, In, Not, Repository } from 'typeorm';
import { PublicKey } from '@solana/web3.js';
import * as BN from 'bn.js';

import { DEFAULT_ITEMS_PER_PAGE } from '../config';
import { ProjectContribution } from './entities/project-contribution.entity';
import { ProjectWithCurrentRound } from './dto/find-all-projects.dto';
import { ProjectPartner } from './entities/project-partner.entity';
import {
  ProjectRound,
  ProjectRoundAccessType,
  ProjectRoundStatus,
} from './entities/project-round.entity';
import { Project } from './entities/project.entity';
import { SolanabeachService } from '../solanabeach/solanabeach.service';
import { flobj } from '../common/string';
import { TicketsService } from '../tickets/tickets.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(ProjectContribution)
    private contribRepo: Repository<ProjectContribution>,
    @InjectRepository(ProjectRound) private roundRepo: Repository<ProjectRound>,
    @InjectRepository(ProjectPartner)
    private partnerRepo: Repository<ProjectPartner>,
    private readonly solanabeach: SolanabeachService,
    private readonly ticketsService: TicketsService,
  ) {}

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
    const { amount } = await this.contribRepo
      .createQueryBuilder()
      .select('SUM(amount)', 'amount')
      .where({ publicKey, roundId })
      .getRawOne();
    return amount;
  }

  async getRoundInfo(roundId: number) {
    return this.roundRepo.findOne({
      where: { id: roundId },
      relations: ['project'],
    });
  }

  async fetchContributions(round: ProjectRound): Promise<{ total: string }> {
    const { amount } = await this.contribRepo
      .createQueryBuilder()
      .select('SUM(amount)', 'amount')
      .where({ roundId: round.id })
      .getRawOne();

    let total = new BN(amount || 0);

    this.logger.verbose(
      `Historical round contributions ${flobj({
        roundId: round.id,
        address: round.address,
        amount,
      })}`,
    );

    const latestContrib = await this.contribRepo.findOne({
      where: { roundId: round.id },
      order: { blocknumber: 'DESC' },
    });

    if (latestContrib) {
      this.logger.verbose(
        `Latest contribution ${flobj({
          roundId: round.id,
          address: round.address,
          blocknumber: latestContrib.blocknumber,
          timestamp: latestContrib.timestamp.toISOString(),
        })}`,
      );
    }

    const limit = 10;
    let offset = 0;

    while (true) {
      const transfers = await this.solanabeach.getTokenTransfers(
        round.address,
        limit,
        offset,
      );

      if (!transfers.length) {
        break;
      }

      this.logger.verbose(
        `Found transfers ${flobj({ count: transfers.length })}`,
      );

      // Historic data?
      if (
        transfers[0] &&
        latestContrib &&
        transfers[0].blocknumber >= latestContrib.blocknumber
      ) {
        break;
      }

      for (const transfer of transfers) {
        const publicKey = transfer.source.address;
        const txHash = transfer.txhash;
        const logobj = {
          publicKey,
          txHash,
          amount: transfer.amount,
        };

        if (transfer.destination.address !== round.address) {
          this.logger.debug(`Invalid destination ${flobj(logobj)}`);
          continue;
        }

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
        contrib.publicKey = transfer.source.address;
        contrib.blocknumber = transfer.blocknumber;
        contrib.timestamp = new Date(transfer.timestamp.absolute);
        contrib.amount = transfer.amount.toString();
        contrib.txHash = transfer.txhash;
        await this.contribRepo.save(contrib);
        this.logger.log(`Saved contrib ${flobj(logobj)}`);
        total = total.add(new BN(contrib.amount));
      }

      // Last page?
      if (transfers.length < limit) {
        break;
      }

      offset += limit;
    }

    await this.roundRepo.update(
      { id: round.id },
      { collectedAmount: total.toString() },
    );

    this.logger.log(
      `Fetched round contributions ${flobj({
        roundId: round.id,
        total: total.toString(),
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
  }) {
    if (filters.take > 10) {
      filters.take = 10;
    }

    const where: {
      accessType?: ProjectRoundAccessType;
      status?: ProjectRoundStatus;
      roundIds?: FindOperator<number>;
    } = {};

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
        where.roundIds = In(roundIds);
      }
    }

    const [list, total] = await this.roundRepo.findAndCount({
      order: { startDate: 'DESC' },
      where,
      skip: filters.skip > 0 ? filters.skip : 0,
      take: filters.take,
      relations: ['project'],
    });

    return { list, total };
  }
}
