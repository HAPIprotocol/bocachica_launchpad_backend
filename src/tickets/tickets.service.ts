import {
  BadRequestException,
  Injectable,
  Logger,
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
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
  ) {}

  async create(createTicketDto: CreateTicketDto) {
    let ticket = await this.ticketRepo.findOne({
      where: {
        projectId: createTicketDto.projectId,
        publicKey: createTicketDto.publicKey,
      },
    });

    if (ticket) {
      return ticket;
    }

    ticket = new Ticket();

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
    ticket.signature = signature;
    ticket.timestamp = new Date();

    const logData = `projectId=${JSON.stringify(
      createTicketDto.projectId,
    )} message=${JSON.stringify(
      createTicketDto.message,
    )} publicKey=${JSON.stringify(
      createTicketDto.publicKey,
    )} signature=${JSON.stringify(createTicketDto.signature)}`;

    if (!this.verifyTicketSignature(ticket)) {
      this.logger.warn(`Invalid signature for ticket ${logData}`);
      throw new BadRequestException(`Invalid signature`);
    } else {
      this.logger.log(`New ticket created ${logData}`);
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
