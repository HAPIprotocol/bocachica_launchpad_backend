import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DEFAULT_ITEMS_PER_PAGE } from '../config';
import { ProjectPartner } from './entities/project-partner.entity';
import { ProjectRound } from './entities/project-round.entity';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Project) private roundRepo: Repository<ProjectRound>,
    @InjectRepository(Project) private partnerRepo: Repository<ProjectPartner>,
  ) {}

  async findAll(skip = 0, take = DEFAULT_ITEMS_PER_PAGE) {
    const [list, total] = await this.projectRepo.findAndCount({
      order: { id: 'ASC' },
      skip: skip > 0 ? skip : 0,
      take,
    });
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
