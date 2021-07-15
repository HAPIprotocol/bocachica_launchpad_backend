import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Ticket } from './entities/ticket.entity';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
    type: Ticket,
  })
  @ApiBadRequestResponse({ status: 401, description: 'Bad request.' })
  create(@Body() createTicketDto: CreateTicketDto): Promise<Ticket> {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  @ApiOkResponse({ description: 'Return list of tickets.' })
  findAll(): Promise<{ list: Ticket[] }> {
    return this.ticketsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Return record data.', type: Ticket })
  @ApiNotFoundResponse({ status: 404, description: 'Not found.' })
  findOne(@Param('id') id: string): Promise<Ticket> {
    return this.ticketsService.findOne(+id);
  }
}
