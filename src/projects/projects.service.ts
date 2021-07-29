import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { DEFAULT_ITEMS_PER_PAGE } from '../config';
import { ProjectWithCurrentRound } from './dto/find-all-projects.dto';
import { ProjectPartner } from './entities/project-partner.entity';
import {
  ProjectRound,
  ProjectRoundStatus,
} from './entities/project-round.entity';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(ProjectRound) private roundRepo: Repository<ProjectRound>,
    @InjectRepository(ProjectPartner)
    private partnerRepo: Repository<ProjectPartner>,
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
    return this.projectRepo
      .findOneOrFail({
        where: { id },
        relations: ['rounds', 'partners'],
      })
      .catch(() => {
        throw new NotFoundException();
      });
  }
}
