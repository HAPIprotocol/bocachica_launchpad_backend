import { ApiProperty } from '@nestjs/swagger';

import { FindAllResultDto } from '../../common/dto/find-all.dto';
import { Project } from '../entities/project.entity';

export class FindAllProjectsResultDto extends FindAllResultDto<Project> {
  @ApiProperty({ type: [Project] })
  list: Project[];
}
