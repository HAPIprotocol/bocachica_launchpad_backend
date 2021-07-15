import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @Column()
  @ApiProperty()
  projectId: number;

  @Column()
  @ApiProperty()
  publicKey: string;

  @Column()
  @ApiProperty()
  signature: string;

  @Column()
  @ApiProperty()
  message: string;

  @Column('timestamptz')
  @ApiProperty()
  timestamp: Date;
}
