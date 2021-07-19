import { ApiProperty } from '@nestjs/swagger';

export abstract class FindAllResultDto<T> {
  @ApiProperty({ isArray: true, description: 'Items list' })
  list: T[];

  @ApiProperty({ example: 10000, description: 'Total items count' })
  total: number;
}
