import { ApiProperty } from '@nestjs/swagger';

export class GetSolPowerDto {
  @ApiProperty({ example: '17172794999' })
  solPower: string;
}
