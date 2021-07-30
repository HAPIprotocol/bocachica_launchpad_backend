import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column()
  @ApiProperty({ example: 101 })
  projectId: number;

  @Column()
  @ApiProperty({ example: 101 })
  roundId: number;

  @Column()
  @ApiProperty({ example: 'JyBc9JbET5v73kAXturzQw9s2AiXQY8gtdbtRMeWtUu' })
  publicKey: string;

  @Column()
  @ApiProperty({
    example:
      '2TB7WbKDQh2ApKwS8UzYAo8U4CxZm4nLJcDRzFp5AQYwg5tgQHvSRSLHuqScQsacqcuynhXS5F6as5Lg3LpcB6Qz',
  })
  signature: string;

  @Column()
  @ApiProperty({ example: 'I want to join project 101 at Boca Chica' })
  message: string;

  @Column('timestamptz')
  @ApiProperty()
  timestamp: Date;
}
