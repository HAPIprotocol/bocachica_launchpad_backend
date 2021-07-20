import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { FindAllProjectsResultDto } from './dto/find-all-projects.dto';
import { FindOneProjectResultDto } from './dto/find-one-project.dto';
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
  findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
  ): Promise<FindAllProjectsResultDto> {
    return this.projectsService.findAll(skip);
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
