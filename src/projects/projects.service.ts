import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as BN from 'bn.js';

import { Web3Connection, WEB3_CONNECTION } from '../web3/web3.module';
import { DEFAULT_ITEMS_PER_PAGE } from '../config';
import { ProjectContribution } from './entities/project-contribution.entity';
import { ProjectWithCurrentRound } from './dto/find-all-projects.dto';
import { ProjectPartner } from './entities/project-partner.entity';
import {
  ProjectRound,
  ProjectRoundStatus,
} from './entities/project-round.entity';
import { Project } from './entities/project.entity';
import { SolanabeachService } from '../solanabeach/solanabeach.service';
import { flobj } from '../common/string';

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
    @Inject(WEB3_CONNECTION)
    private readonly web3: Web3Connection,
    private readonly solanabeach: SolanabeachService,
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
      where: { roundId },
      relations: ['project'],
    });
  }

  async fetchContributions(round: ProjectRound): Promise<{ total: string }> {
    const { amount } = await this.contribRepo
      .createQueryBuilder()
      .select('SUM(amount)', 'amount')
      .where({ roundId: round.id })
      .getRawOne();

    let total = new BN(amount);

    const latestContrib = await this.contribRepo.findOne({
      where: { roundId: round.id },
      order: { blocknumber: 'DESC' },
    });

    const offset = 100;
    let limit = 0;

    while (true) {
      const transfers = await this.solanabeach.getTokenTransfers(
        round.address,
        limit,
        offset,
      );

      if (!transfers) {
        this.logger.error(`Can't fetch transfers for address ${round.address}`);
        break;
      }

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
      if (transfers.length < offset) {
        break;
      }

      limit += offset;
    }

    this.logger.log(
      `Fetched round contributions ${flobj({ total: total.toString() })}`,
    );

    return { total: total.toString() };
  }
}
