import { Test, TestingModule } from '@nestjs/testing';

import { Web3Module } from '../web3/web3.module';
import { SolanabeachModule } from '../solanabeach/solanabeach.module';
import {
  IMockEntityProvider,
  mockEntityProvider,
} from '../../test/util/typeorm';
import { ProjectContribution } from './entities/project-contribution.entity';
import { ProjectPartner } from './entities/project-partner.entity';
import { ProjectRound } from './entities/project-round.entity';
import { Project } from './entities/project.entity';
import { ProjectsService } from './projects.service';
import { SolanabeachService } from '../solanabeach/solanabeach.service';

jest.mock('../solanabeach/solanabeach.service');

describe('ProjectsService', () => {
  let projectsService: ProjectsService;
  let solanabeachService: SolanabeachService;
  let projectProvider: IMockEntityProvider<Project>;
  let projectContribProvider: IMockEntityProvider<ProjectContribution>;
  let projectRoundProvider: IMockEntityProvider<ProjectRound>;
  let projectPartnerProvider: IMockEntityProvider<ProjectPartner>;

  beforeEach(async () => {
    jest.resetAllMocks();

    projectProvider = mockEntityProvider(Project);
    projectContribProvider = mockEntityProvider(ProjectContribution);
    projectRoundProvider = mockEntityProvider(ProjectRound);
    projectPartnerProvider = mockEntityProvider(ProjectPartner);

    const module: TestingModule = await Test.createTestingModule({
      imports: [Web3Module, SolanabeachModule],
      providers: [
        ProjectsService,
        projectProvider,
        projectContribProvider,
        projectRoundProvider,
        projectPartnerProvider,
      ],
    }).compile();

    projectsService = module.get<ProjectsService>(ProjectsService);
    solanabeachService = module.get<SolanabeachService>(SolanabeachService);
  });

  it('should be defined', () => {
    expect(projectsService).toBeDefined();
  });

  describe('findAll', () => {
    it('should find all - empty', async () => {
      jest
        .spyOn(projectProvider.repo, 'findAndCount')
        .mockImplementationOnce(() => {
          return Promise.resolve([[], 0]);
        });

      const result = await projectsService.findAll();

      expect(result).toMatchSnapshot();
    });

    it('should find all - basic', async () => {
      const PROJECTS: Project[] = [
        Object.assign(new Project(), { id: 1, title: 'top project' }),
      ];

      const ROUNDS: ProjectRound[] = [
        Object.assign(new ProjectRound(), { id: 1, projectId: PROJECTS[0].id }),
      ];

      jest
        .spyOn(projectProvider.repo, 'findAndCount')
        .mockImplementationOnce(() => {
          return Promise.resolve([PROJECTS, PROJECTS.length]);
        });

      jest
        .spyOn(projectRoundProvider.repo, 'findOne')
        .mockImplementation((args) => {
          if ((args as any).where.projectId == PROJECTS[0].id) {
            return Promise.resolve(ROUNDS[0]);
          }
        });

      const result = await projectsService.findAll();

      expect(result).toMatchSnapshot();
    });
  });

  describe('findOne', () => {
    it('should find one', async () => {
      jest
        .spyOn(projectProvider.repo, 'findOne')
        .mockResolvedValue({ id: 1 } as any);

      const result = await projectsService.findOne(10);

      expect(result).toMatchSnapshot();
    });

    it('should throw not found exception', async () => {
      jest.spyOn(projectProvider.repo, 'findOne').mockResolvedValue(undefined);

      await expect(() => projectsService.findOne(10)).rejects.toThrowError(
        'Not Found',
      );
    });
  });

  describe('getContrib', () => {
    it('should get round contribution', async () => {
      jest
        .spyOn(projectContribProvider.repo, 'createQueryBuilder')
        .mockImplementation(() => {
          const qb = {
            where: () => qb,
            select: () => qb,
            getRawOne: () => ({
              amount: 10,
            }),
          } as any;

          return qb;
        });

      const result = await projectsService.getContrib(
        '7jkywwRB2TCnXw3FNa2B6KXtRt686gBHB4W6yJQvKVcx',
        1,
      );

      expect(result).toMatchSnapshot();
    });
  });

  describe('getRoundInfo', () => {
    it('should get round info', async () => {
      jest
        .spyOn(projectRoundProvider.repo, 'findOne')
        .mockResolvedValue(Object.assign(new ProjectRound(), { id: 10 }));

      const result = await projectsService.getRoundInfo(10);

      expect(result).toMatchSnapshot();
    });
  });

  describe('fetchContributions', () => {
    it('should fetcn contributions', async () => {
      const ROUND = Object.assign(new ProjectRound(), {
        id: 1,
        projectId: 101,
        address: '9AGQDaDvEruNVTmL9HzEE4f8NMMMbfvm9rB6wABWGCc8',
        timestamp: new Date('2021-07-29'),
      });

      jest
        .spyOn(projectContribProvider.repo, 'findOne')
        .mockResolvedValue(undefined);

      jest
        .spyOn(solanabeachService, 'getTokenTransfers')
        .mockResolvedValueOnce([
          {
            amount: 113042606,
            blocknumber: 89131008,
            txhash:
              'gXHFaSGt2JGp7fydRV29a2PmHv9DmdwsKLAYNnp5zpW19uRHRRUJc5EdVMhEFDoFotgrJQ1wrsDTQahB2ezTKRN',
            source: { address: 'Fnnxd8to7JYEAhNSuBA9GS1v5MrHnEvGVCNMszemHabr' },
            destination: {
              address: '9AGQDaDvEruNVTmL9HzEE4f8NMMMbfvm9rB6wABWGCc8',
            },
            valid: true,
            timestamp: { absolute: 1627569141000, relative: 1627569141000 },
          } as any,
        ]);

      jest
        .spyOn(projectContribProvider.repo, 'createQueryBuilder')
        .mockImplementation(() => {
          const qb = {
            where: () => qb,
            select: () => qb,
            getRawOne: () => ({
              amount: 0,
            }),
          } as any;

          return qb;
        });

      jest
        .spyOn(projectContribProvider.repo, 'save')
        .mockImplementation((item) =>
          Promise.resolve(Object.assign(new ProjectContribution(), item)),
        );

      jest
        .spyOn(projectRoundProvider.repo, 'update')
        .mockResolvedValue({} as any);

      const result = await projectsService.fetchContributions(ROUND);

      expect(result).toEqual({ total: '113042606' });
    });
  });
});
