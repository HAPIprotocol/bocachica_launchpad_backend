import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString } from 'class-validator';

export class ContributeToProjectDto {
  @ApiProperty({ type: Number })
  @IsInt()
  @IsPositive()
  roundId: number;

  @ApiProperty({ type: String })
  @IsString()
  txHash: string;
}

export class ContributeToProjectResponseDto {
  @ApiProperty({ type: Boolean })
  acknowledged: boolean;
}
