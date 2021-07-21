import { ApiProperty } from '@nestjs/swagger';

export class GetBalanceDto {
  @ApiProperty({ example: 17172794999 })
  balance: number;
}
