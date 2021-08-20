import { ApiProperty } from '@nestjs/swagger';
import { IsBooleanString } from 'class-validator';

export class IsWhitelistedResponseDto {
  @ApiProperty({ type: Boolean })
  @IsBooleanString()
  isWhitelisted: boolean;
}
