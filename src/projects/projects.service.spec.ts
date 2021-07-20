import { Test, TestingModule } from '@nestjs/testing';

import {
  IMockEntityProvider,
  mockEntityProvider,
} from '../../test/util/typeorm';
import { Project } from './entities/project.entity';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let tableProvider: IMockEntityProvider<Project>;

  beforeEach(async () => {
    tableProvider = mockEntityProvider(Project);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsService, tableProvider],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
