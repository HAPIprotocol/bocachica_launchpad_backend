import { ApiProperty } from '@nestjs/swagger';

export class FindOneDto<T> {
  @ApiProperty({ description: 'Item data' })
  item: T;
}
