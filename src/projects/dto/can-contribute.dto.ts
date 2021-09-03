import { ApiProperty } from '@nestjs/swagger';
import { IsBooleanString } from 'class-validator';

export class CanContributeResponseDto {
  @ApiProperty({ type: Boolean })
  @IsBooleanString()
  canContribute: boolean;
}
