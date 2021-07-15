import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateTicketDto } from './dto/create-ticket.dto';
import { Ticket } from './entities/ticket.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
  ) {}

  async create(createTicketDto: CreateTicketDto) {
    const ticket = new Ticket();

    ticket.projectId = createTicketDto.projectId;
    ticket.message = createTicketDto.message;
    ticket.publicKey = createTicketDto.publicKey;
    ticket.signature = createTicketDto.signature;
    ticket.timestamp = Date.now();

    return this.ticketRepo.save(ticket);
  }

  async findAll() {
    const list = await this.ticketRepo.find();
    return { list };
  }

  async findOne(id: number) {
    return this.ticketRepo.findOne(+id);
  }
}
