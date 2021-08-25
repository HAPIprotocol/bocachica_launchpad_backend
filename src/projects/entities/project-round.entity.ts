import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProjectParticipant } from './project-participant.entity';
import { Project } from './project.entity';

export enum ProjectRoundStatus {
  Pending = 'pending',
  Active = 'active',
  Finished = 'finished',
  Hidden = 'hidden',
}

export enum ProjectRoundAccessType {
  Private = 'private',
  Public = 'public',
}

export enum ProjectRoundAllocationType {
  Amount = 'by_amount',
  Subscription = 'by_subscription',
}

@Entity()
@Index(['status', 'accessType', 'currency', 'name', 'allocationType'])
export class ProjectRound {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column()
  @ApiProperty({ example: 101 })
  projectId: number;

  @Column({ nullable: true })
  @ApiPropertyOptional({ example: 2 })
  projectIndex?: number;

  @Column({ type: 'enum', enum: ProjectRoundStatus })
  @ApiProperty({ example: ProjectRoundStatus.Active, enum: ProjectRoundStatus })
  status: ProjectRoundStatus;

  @Column({ type: 'enum', enum: ProjectRoundAccessType })
  @ApiProperty({
    example: ProjectRoundAccessType.Public,
    enum: ProjectRoundAccessType,
  })
  accessType: ProjectRoundAccessType;

  @Column({ type: 'enum', enum: ProjectRoundAllocationType })
  @ApiProperty({
    example: ProjectRoundAllocationType.Amount,
    enum: ProjectRoundAllocationType,
  })
  allocationType: ProjectRoundAllocationType;

  @Column()
  @ApiProperty({ example: 'First public round' })
  name: string;

  @Column({ type: 'bigint', default: '0' })
  @ApiProperty({ example: '1000000.0000' })
  targetAmount = '0';

  @Column({ type: 'bigint', default: '0' })
  @ApiProperty({ example: '1000000.0000' })
  collectedAmount = '0';

  @Column({ type: 'bigint', default: '0' })
  @ApiProperty({ example: '10000' })
  minAmount = '0';

  @Column({ type: 'bigint', default: '0' })
  @ApiProperty({ example: '20000' })
  maxAmount = '0';

  @Column({ type: 'decimal', nullable: true })
  @ApiPropertyOptional({ example: 0.5 })
  solPowerRate?: number;

  @Column({ default: false })
  @ApiProperty({ example: true })
  solPowerScaling: boolean;

  @Column({ default: true })
  @ApiProperty({ example: true })
  solPowerCheck: boolean;

  @Column()
  @ApiProperty({ example: 'SOL' })
  currency: string;

  @Column({ type: 'int', default: 9 })
  @ApiProperty({ example: 9 })
  decimals = 9;

  @Column()
  @ApiProperty({ example: 'AEftAnw7UJLZx427q5AyaaA3XYzp9Kcw7MLu7yFJJgiA' })
  address: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 'AEftAnw7UJLZx427q5AyaaA3XYzp9Kcw7MLu7yFJJgiA',
  })
  smartcontractAddress?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({ example: 'https://example.net/icon.png' })
  tokenIcon: string;

  @Column({ type: 'decimal', default: 1 })
  @ApiProperty({ example: 1 })
  emissionRatio: number;

  @Column({ type: 'timestamptz' })
  @ApiProperty()
  startDate: Date;

  @Column({ type: 'timestamptz' })
  @ApiProperty()
  endDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  @ApiPropertyOptional()
  emissionDate?: Date;

  @ManyToOne(() => Project, (project) => project.rounds)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @OneToMany(() => ProjectParticipant, (participant) => participant.round)
  @JoinColumn({ name: 'roundId' })
  participants: ProjectParticipant[];

  async tokenAddress() {
    return Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      new PublicKey(this.smartcontractAddress),
      new PublicKey(this.address),
    );
  }
}
