import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ProjectRound } from './project-round.entity';

@Entity()
@Index(['roundId', 'publicKey'], { unique: true })
export class ProjectParticipant {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column()
  @ApiProperty({ example: 101 })
  roundId: number;

  @Column()
  @ApiProperty({ example: 'AEftAnw7UJLZx427q5AyaaA3XYzp9Kcw7MLu7yFJJgiA' })
  publicKey: string;

  @ManyToOne(() => ProjectRound, (round) => round.participants)
  @JoinColumn({ name: 'roundId' })
  round: ProjectRound;
}
