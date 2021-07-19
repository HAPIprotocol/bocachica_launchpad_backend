import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bs58 from 'bs58';
import { PublicKey } from '@solana/web3.js';
import * as nacl from 'tweetnacl';

import { CreateTicketDto } from './dto/create-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { DEFAULT_ITEMS_PER_PAGE } from 'src/config';

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
    ticket.timestamp = new Date();

    if (!this.verifyTicketSignature(ticket)) {
      throw new BadRequestException(`Invalid signature`);
    }

    return this.ticketRepo.save(ticket);
  }

  async findAll(skip = 0, take = DEFAULT_ITEMS_PER_PAGE) {
    const [list, total] = await this.ticketRepo.findAndCount({
      order: { id: 'ASC' },
      skip: skip > 0 ? skip : 0,
      take,
    });
    return { list, total };
  }

  async findOne(id: number) {
    return this.ticketRepo.findOne(+id);
  }

  verifyTicketSignature(ticket: Ticket): boolean {
    const publicKey = new PublicKey(ticket.publicKey);
    const signature = bs58.decode(ticket.signature);
    const signData = Buffer.from(ticket.message);
    return nacl.sign.detached.verify(signData, signature, publicKey.toBuffer());
  }
}
