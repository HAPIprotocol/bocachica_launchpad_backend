import { Test, TestingModule } from '@nestjs/testing';

import {
  IMockEntityProvider,
  mockEntityProvider,
} from '../../test/util/typeorm';
import { Project } from './entities/project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let tableProvider: IMockEntityProvider<Project>;

  beforeEach(async () => {
    tableProvider = mockEntityProvider(Project);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [ProjectsService, tableProvider],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
