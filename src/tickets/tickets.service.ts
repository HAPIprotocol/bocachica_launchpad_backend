import { Injectable } from '@nestjs/common';

import { CreateTicketDto } from './dto/create-ticket.dto';
import { Ticket } from './entities/ticket.entity';

@Injectable()
export class TicketsService {
  create(createTicketDto: CreateTicketDto) {
    const ticket = new Ticket();

    ticket.projectId = createTicketDto.projectId;
    ticket.message = createTicketDto.message;
    ticket.publicKey = createTicketDto.publicKey;
    ticket.signature = createTicketDto.signature;
    ticket.timestamp = Date.now();

    // TODO: persist ticket

    return ticket;
  }

  findAll() {
    return `This action returns all tickets`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ticket`;
  }
}
