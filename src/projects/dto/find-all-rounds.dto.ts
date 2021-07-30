import { ApiProperty } from '@nestjs/swagger';

import { FindAllResultDto } from '../../common/dto/find-all.dto';
import { ProjectRound } from '../entities/project-round.entity';

export class FindAllRoundsResultDto extends FindAllResultDto<ProjectRound> {
  @ApiProperty({ type: [ProjectRound] })
  list: ProjectRound[];
}
