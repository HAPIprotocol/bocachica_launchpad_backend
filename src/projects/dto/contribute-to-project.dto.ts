import { ApiProperty } from '@nestjs/swagger';
import { IsBase64, IsInt, IsPositive } from 'class-validator';

export class ContributeToProjectDto {
  @ApiProperty({ type: Number })
  @IsInt()
  @IsPositive()
  roundId: number;

  @ApiProperty({ type: String })
  @IsBase64()
  txHash: string;
}

export class ContributeToProjectResponseDto {
  @ApiProperty({ type: Boolean })
  acknowledged: boolean;
}
