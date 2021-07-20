import { ApiProperty } from '@nestjs/swagger';

import { FindOneDto } from '../../common/dto/find-one.dto';
import { ProjectPartner } from '../entities/project-partner.entity';
import { ProjectRound } from '../entities/project-round.entity';
import { Project } from '../entities/project.entity';

export class ProjectDetailed extends Project {
  @ApiProperty({ isArray: true, type: ProjectPartner })
  partners: ProjectPartner[];

  @ApiProperty({ isArray: true, type: ProjectRound })
  rounds: ProjectRound[];
}

export class FindOneProjectResultDto extends FindOneDto<Project> {
  @ApiProperty({ type: ProjectDetailed })
  item: ProjectDetailed;
}
