import { ApiProperty } from '@nestjs/swagger';

import { FindAllResultDto } from '../../common/dto/find-all.dto';
import { Ticket } from '../entities/ticket.entity';

export class FindAllTicketsResultDto extends FindAllResultDto<Ticket> {
  @ApiProperty({ type: [Ticket] })
  list: Ticket[];
}
