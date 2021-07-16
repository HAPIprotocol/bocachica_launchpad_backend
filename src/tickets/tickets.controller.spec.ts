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
});
