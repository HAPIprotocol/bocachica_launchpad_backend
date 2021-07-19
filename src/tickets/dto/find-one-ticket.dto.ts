import { ApiProperty } from '@nestjs/swagger';

import { FindOneDto } from '../../common/dto/find-one.dto';
import { Ticket } from '../entities/ticket.entity';

export class FindOneTicketResultDto extends FindOneDto<Ticket> {
  @ApiProperty({ type: Ticket })
  item: Ticket;
}
