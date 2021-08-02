import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { FindAllProjectsResultDto } from './dto/find-all-projects.dto';
import { FindAllRoundsResultDto } from './dto/find-all-rounds.dto';
import { FindOneProjectResultDto } from './dto/find-one-project.dto';
import { FindOneRoundResultDto } from './dto/find-one-round.dto';
import { GetRoundContributionDto } from './dto/get-round-contribution.dto';
import {
  ProjectRoundAccessType,
  ProjectRoundStatus,
} from './entities/project-round.entity';
import { ProjectsService } from './projects.service';

@Controller('projects')
@ApiTags('Projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOkResponse({
    description: 'Return list of projects',
    type: FindAllProjectsResultDto,
  })
  @ApiQuery({
    name: 'skip',
    type: Number,
    required: false,
  })
  findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
  ): Promise<FindAllProjectsResultDto> {
    return this.projectsService.findAll(skip);
  }

  @Get('roundContribution')
  @ApiOkResponse({
    description: 'Get round contribution for public key',
    type: GetRoundContributionDto,
  })
  async getRoundContribution(
    @Query('publicKey') publicKey: string,
    @Query('roundId', ParseIntPipe) roundId: number,
  ): Promise<GetRoundContributionDto> {
    const amount = await this.projectsService.getContrib(publicKey, roundId);
    return { amount };
  }

  @Get('rounds')
  @ApiOkResponse({
    description: 'Get round list',
    type: FindAllRoundsResultDto,
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
    name: 'accessType',
    type: Number,
    required: false,
    enum: ProjectRoundAccessType,
  })
  @ApiQuery({
    name: 'status',
    type: Number,
    required: false,
    enum: ProjectRoundStatus,
  })
  @ApiQuery({
    name: 'publicKey',
    type: String,
    required: false,
  })
  async findAllRounds(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(3), ParseIntPipe) take: number,
    @Query('accessType') accessType?: ProjectRoundAccessType,
    @Query('status') status?: ProjectRoundStatus,
    @Query('publicKey') publicKey?: string,
  ): Promise<FindAllRoundsResultDto> {
    return this.projectsService.findAllRounds({
      skip,
      take,
      accessType,
      status,
      publicKey,
    });
  }

  @Get('round/:id')
  @ApiOkResponse({
    description: 'Return project round data',
    type: FindOneRoundResultDto,
  })
  @ApiNotFoundResponse({ status: 404, description: 'Not found' })
  async findOneRound(@Param('id') id: string): Promise<FindOneRoundResultDto> {
    const item = await this.projectsService.findOneRound(+id);
    return { item };
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'Return record data',
    type: FindOneProjectResultDto,
  })
  @ApiNotFoundResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id') id: string): Promise<FindOneProjectResultDto> {
    const item = await this.projectsService.findOne(+id);
    return { item };
  }
}
