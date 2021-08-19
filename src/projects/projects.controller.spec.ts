import { CacheModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

jest.mock('./projects.service');

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      controllers: [ProjectsController],
      providers: [ProjectsService],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should find all', async () => {
      jest
        .spyOn(service, 'findAll')
        .mockResolvedValueOnce({ list: [], total: 0 });

      const result = await controller.findAll();

      expect(result).toEqual({ list: [], total: 0 });
    });

    it('should find all with skip', async () => {
      jest
        .spyOn(service, 'findAll')
        .mockResolvedValueOnce({ list: [], total: 0 });

      const result = await controller.findAll(10);

      expect(result).toEqual({ list: [], total: 0 });
    });
  });

  describe('findOne', () => {
    it('should find one', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ id: 10 } as any);

      const result = await controller.findOne('10');

      expect(result).toEqual({ item: { id: 10 } });
    });
  });

  describe('getRoundContribution', () => {
    it('should get round contribution', async () => {
      jest.spyOn(service, 'getContrib').mockResolvedValueOnce(10);

      const result = await controller.getRoundContribution(
        '7jkywwRB2TCnXw3FNa2B6KXtRt686gBHB4W6yJQvKVcx',
        1,
      );

      expect(result).toEqual({ amount: 10 });
    });
  });
});
