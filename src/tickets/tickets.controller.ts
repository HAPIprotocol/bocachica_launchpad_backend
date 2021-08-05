import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { TicketsService } from './tickets.service';
import {
  CreateTicketDto,
  CreateTicketResultDto,
} from './dto/create-ticket.dto';
import { FindAllTicketsResultDto } from './dto/find-all-tickets.dto';
import { FindOneTicketResultDto } from './dto/find-one-ticket.dto';
import { DEFAULT_ITEMS_PER_PAGE } from '../config';

@Controller('tickets')
@ApiTags('Tickets')
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
  @ApiQuery({
    name: 'skip',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'take',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'publicKey',
    type: String,
    required: true,
  })
  findAll(
    @Query('publicKey') publicKey: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(DEFAULT_ITEMS_PER_PAGE), ParseIntPipe)
    take?: number,
  ): Promise<FindAllTicketsResultDto> {
    if (!publicKey) {
      throw new NotFoundException();
    }
    return this.ticketsService.findAll(publicKey, skip, take);
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
