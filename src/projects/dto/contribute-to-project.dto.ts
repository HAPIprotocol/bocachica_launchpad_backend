import { ApiProperty } from '@nestjs/swagger';

export class ContributeToProjectDto {
  @ApiProperty({ type: Number })
  roundId: number;

  @ApiProperty({ type: String })
  txHash: string;
}

export class ContributeToProjectResponseDto {
  @ApiProperty({ type: Boolean })
  acknowledged: boolean;
}
