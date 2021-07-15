import { IsInt, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ example: 101 })
  @IsInt()
  projectId: number;

  @ApiProperty({ example: 'JyBc9JbET5v73kAXturzQw9s2AiXQY8gtdbtRMeWtUu' })
  @IsString()
  publicKey: string;

  @ApiProperty({
    example:
      '2TB7WbKDQh2ApKwS8UzYAo8U4CxZm4nLJcDRzFp5AQYwg5tgQHvSRSLHuqScQsacqcuynhXS5F6as5Lg3LpcB6Qz',
  })
  @IsString()
  signature: string;

  @ApiProperty({ example: 'Join project 101 on bocachica.io' })
  @IsString()
  message: string;
}
