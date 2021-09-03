import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumberString, IsPositive, IsString } from 'class-validator';

export class ContributeToProjectDto {
  @ApiProperty({ type: String })
  @IsString()
  publicKey: string;

  @ApiProperty({ type: Number })
  @IsInt()
  @IsPositive()
  roundId: number;

  @ApiProperty({ type: String })
  @IsString()
  txHash: string;

  @ApiProperty({ type: String })
  @IsNumberString()
  amount: string;
}

export class ContributeToProjectResponseDto {
  @ApiProperty({ type: Boolean })
  acknowledged: boolean;
}
