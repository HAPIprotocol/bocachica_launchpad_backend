import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { TicketsService } from './tickets.service';
import {
  CreateTicketDto,
  CreateTicketResultDto,
} from './dto/create-ticket.dto';
import { FindAllTicketsResultDto } from './dto/find-all-tickets.dto';
import { FindOneTicketResultDto } from './dto/find-one-ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'The record has been successfully created',
    type: CreateTicketResultDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid signature' })
  async create(
    @Body() createTicketDto: CreateTicketDto,
  ): Promise<CreateTicketResultDto> {
    const item = await this.ticketsService.create(createTicketDto);
    return { item };
  }

  @Get()
  @ApiOkResponse({
    description: 'Return list of tickets',
    type: FindAllTicketsResultDto,
  })
  findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
  ): Promise<FindAllTicketsResultDto> {
    return this.ticketsService.findAll(skip);
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'Return record data',
    type: FindOneTicketResultDto,
  })
  @ApiNotFoundResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id') id: string): Promise<FindOneTicketResultDto> {
    const item = await this.ticketsService.findOne(+id);
    return { item };
  }
}
