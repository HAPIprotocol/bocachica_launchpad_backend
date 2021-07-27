import { Test, TestingModule } from '@nestjs/testing';

import {
  IMockEntityProvider,
  mockEntityProvider,
} from '../../test/util/typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

describe('TicketsController', () => {
  let controller: TicketsController;
  let tableProvider: IMockEntityProvider<Ticket>;

  beforeEach(async () => {
    tableProvider = mockEntityProvider(Ticket);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [TicketsService, tableProvider],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a ticket', async () => {
    const saveSpy = jest.spyOn(tableProvider.repo, 'save');
    saveSpy.mockResolvedValue({ id: 1 } as any);

    const result = await controller.create({
      projectId: 101,
      message: 'I want to join project #1 on Boca Chica!',
      publicKey: '3CEXr4pyPo2DUbnCNnt8ZjfVq6b4tvrnSx6q1omRxGGW',
      signature:
        '751613f040dd8135258e0e7be66dfcdfaf55a1065c914a0e235f1cf73ee927f30c0c91a388053220fa2fe521bfa974eb97115472d5c0215fbc5cd048b4a6db0c',
    });

    expect(result).toEqual({ item: { id: 1 } });
  });
});
