import { Test, TestingModule } from '@nestjs/testing';
import * as bs58 from 'bs58';

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

  it('should verify signature 1', async () => {
    const publicKey = 'Cs4fUYKWy5ZHew7qAJgoev6qrpEErF4yw5zZmKoQmw75';
    const signature =
      '4Ts737ZTqsAbSK9KHKuF1sB31cQFjBCDLLRoii5ZupTzx71iLen1QuETFvt5fkF2f1yBHNHBoDRaYbJ9B6Rbwem7';
    const message = 'Ere we go, ere we go, cross the Kosmos.';

    const ticket = new Ticket();
    Object.assign(ticket, { publicKey, signature, message } as Partial<Ticket>);

    expect(service.verifyTicketSignature(ticket)).toBeTruthy();
  });

  it('should verify signature 2', async () => {
    const publicKey = '3CEXr4pyPo2DUbnCNnt8ZjfVq6b4tvrnSx6q1omRxGGW';
    const signature = bs58.encode(
      Buffer.from(
        '751613f040dd8135258e0e7be66dfcdfaf55a1065c914a0e235f1cf73ee927f30c0c91a388053220fa2fe521bfa974eb97115472d5c0215fbc5cd048b4a6db0c',
        'hex',
      ),
    );
    const message = 'I want to join project #1 on Boca Chica!';
    const ticket = new Ticket();
    Object.assign(ticket, { publicKey, signature, message } as Partial<Ticket>);

    expect(service.verifyTicketSignature(ticket)).toBeTruthy();
  });
});
