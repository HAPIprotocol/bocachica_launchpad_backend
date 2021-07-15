import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Ticket } from './entities/ticket.entity';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
  })
  @ApiResponse({ status: 401, description: 'Bad request.' })
  create(@Body() createTicketDto: CreateTicketDto): Promise<Ticket> {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  findAll(): Promise<{ list: Ticket[] }> {
    return this.ticketsService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Return record data.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  findOne(@Param('id') id: string): Promise<Ticket> {
    return this.ticketsService.findOne(+id);
  }
}
