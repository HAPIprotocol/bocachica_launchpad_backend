import { ApiProperty } from '@nestjs/swagger';

import { FindOneDto } from '../../common/dto/find-one.dto';
import { ProjectRound } from '../entities/project-round.entity';

export class FindOneRoundResultDto extends FindOneDto<ProjectRound> {
  @ApiProperty({ type: ProjectRound })
  item: ProjectRound;
}
