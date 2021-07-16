import { Test, TestingModule } from '@nestjs/testing';

import {
  IMockEntityProvider,
  mockEntityProvider,
} from '../../test/util/typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  let service: TicketsService;
  let tableProvider: IMockEntityProvider<Ticket>;

  beforeEach(async () => {
    tableProvider = mockEntityProvider(Ticket);

    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketsService, tableProvider],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should verify signature', async () => {
    const publicKey = 'Cs4fUYKWy5ZHew7qAJgoev6qrpEErF4yw5zZmKoQmw75';
    const signature =
      '4Ts737ZTqsAbSK9KHKuF1sB31cQFjBCDLLRoii5ZupTzx71iLen1QuETFvt5fkF2f1yBHNHBoDRaYbJ9B6Rbwem7';
    const message = 'Ere we go, ere we go, cross the Kosmos.';

    const ticket = new Ticket();
    Object.assign(ticket, { publicKey, signature, message } as Partial<Ticket>);

    expect(service.verifyTicketSignature(ticket)).toBeTruthy();
  });
});
