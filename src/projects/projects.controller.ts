import {
  Body,
  CacheInterceptor,
  CacheTTL,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { isValidPublicKey } from '../common/crypto';
import { CanContributeResponseDto } from './dto/can-contribute.dto';
import {
  ContributeToProjectDto,
  ContributeToProjectResponseDto,
} from './dto/contribute-to-project.dto';
import { FindAllProjectsResultDto } from './dto/find-all-projects.dto';
import { FindAllRoundsResultDto } from './dto/find-all-rounds.dto';
import { FindOneProjectResultDto } from './dto/find-one-project.dto';
import { FindOneRoundResultDto } from './dto/find-one-round.dto';
import { GetRoundContributionDto } from './dto/get-round-contribution.dto';
import { IsWhitelistedResponseDto } from './dto/is-whitelisted.dto';
import {
  ProjectRoundAccessType,
  ProjectRoundStatus,
} from './entities/project-round.entity';
import { ProjectsService } from './projects.service';

export const ROUNDS_CACHE_TTL = 5;
export const ROUND_CONTRIBUTION_TTL = 1;
export const WHITELIST_CACHE_TTL = 60;
export const CAN_CONTRIBUTE_CACHE_TTL = 1;

@UseInterceptors(CacheInterceptor)
@Controller('projects')
@ApiTags('Projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('contribute')
  @ApiCreatedResponse({
    description: 'Contribution acknowledged',
    type: ContributeToProjectResponseDto,
  })
  async contribute(
    @Body() contributeDto: ContributeToProjectDto,
  ): Promise<ContributeToProjectResponseDto> {
    const { publicKey, txHash, roundId, amount } = contributeDto;

    try {
      await this.projectsService.reportContribution(
        publicKey,
        txHash,
        roundId,
        amount,
      );
      return { acknowledged: true };
    } catch (_) {
      return { acknowledged: false };
    }
  }

  // @Get()
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
  @CacheTTL(ROUND_CONTRIBUTION_TTL)
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
  @CacheTTL(ROUNDS_CACHE_TTL)
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
  @ApiQuery({
    name: 'query',
    type: String,
    required: false,
  })
  async findAllRounds(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(3), ParseIntPipe) take: number,
    @Query('accessType') accessType?: ProjectRoundAccessType,
    @Query('status') status?: ProjectRoundStatus,
    @Query('publicKey') publicKey?: string,
    @Query('query') query?: string,
  ): Promise<FindAllRoundsResultDto> {
    return this.projectsService.findAllRounds({
      skip,
      take,
      accessType,
      status,
      publicKey,
      query,
    });
  }

  @Get('round/:id/isWhitelisted')
  @CacheTTL(WHITELIST_CACHE_TTL)
  @ApiOkResponse({
    description: 'Whether a public key is whitelisted in the round',
    type: IsWhitelistedResponseDto,
  })
  @ApiQuery({
    name: 'publicKey',
    type: String,
    required: true,
  })
  async isWhitelisted(
    @Param('id') roundId: string,
    @Query('publicKey') publicKey?: string,
  ): Promise<IsWhitelistedResponseDto> {
    if (!isValidPublicKey(publicKey)) {
      return { isWhitelisted: false };
    }

    const isWhitelisted = await this.projectsService.isWhitelisted(
      Number(roundId),
      publicKey,
    );

    return { isWhitelisted };
  }

  @Get('round/:id/canContribute')
  @CacheTTL(CAN_CONTRIBUTE_CACHE_TTL)
  @ApiOkResponse({
    description:
      'Whether a public key can contribute to the round at the moment',
    type: CanContributeResponseDto,
  })
  @ApiQuery({
    name: 'publicKey',
    type: String,
    required: true,
  })
  async canContribute(
    @Param('id') roundId: string,
    @Query('publicKey') publicKey: string,
  ): Promise<CanContributeResponseDto> {
    if (!isValidPublicKey(publicKey)) {
      return { canContribute: false };
    }

    const canContribute = await this.projectsService.canContribute(
      Number(roundId),
      publicKey,
    );

    return { canContribute };
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

  // @Get(':id')
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
