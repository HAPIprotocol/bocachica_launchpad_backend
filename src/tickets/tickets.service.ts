import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bs58 from 'bs58';
import { PublicKey } from '@solana/web3.js';
import * as nacl from 'tweetnacl';

import { CreateTicketDto } from './dto/create-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { DEFAULT_ITEMS_PER_PAGE } from '../config';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
  ) {}

  async create(createTicketDto: CreateTicketDto) {
    const ticket = new Ticket();

    // Expect signature in base58 encoding
    let signature = createTicketDto.signature;

    try {
      if (signature.length === 128) {
        // Convert to base58 if in hex
        signature = bs58.encode(Buffer.from(signature, 'hex'));
      }
    } catch (_) {
      throw new BadRequestException(`Invalid signature: hex encoding`);
    }

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
    return this.ticketRepo.findOneOrFail(+id).catch(() => {
      throw new NotFoundException();
    });
  }

  verifyTicketSignature(ticket: Ticket): boolean {
    try {
      const publicKey = new PublicKey(ticket.publicKey);
      const signature = bs58.decode(ticket.signature);
      const signData = Buffer.from(ticket.message);
      return nacl.sign.detached.verify(
        signData,
        signature,
        publicKey.toBuffer(),
      );
    } catch (_) {
      return false;
    }
  }
}
