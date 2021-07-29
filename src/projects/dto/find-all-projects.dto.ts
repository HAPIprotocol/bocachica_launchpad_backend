import { ApiProperty } from '@nestjs/swagger';

import { FindAllResultDto } from '../../common/dto/find-all.dto';
import { ProjectRound } from '../entities/project-round.entity';
import { Project } from '../entities/project.entity';

export class ProjectWithCurrentRound extends Project {
  @ApiProperty({ type: ProjectRound })
  currentRound?: ProjectRound;
}

export class FindAllProjectsResultDto extends FindAllResultDto<Project> {
  @ApiProperty({ type: [ProjectWithCurrentRound] })
  list: ProjectWithCurrentRound[];
}
