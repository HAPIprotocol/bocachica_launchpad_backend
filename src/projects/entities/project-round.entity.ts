import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from './project.entity';

export enum ProjectRoundStatus {
  Pending = 'pending',
  Active = 'active',
  Finished = 'finished',
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
export class ProjectRound {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column()
  @ApiProperty({ example: 101 })
  projectId: number;

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

  @Column()
  @ApiProperty({ example: '1000000.0000' })
  targetAmount: string;

  @Column()
  @ApiProperty({ example: '1000000.0000' })
  collectedAmount: string;

  @Column()
  @ApiProperty({ example: '1.0000' })
  minAmount: string;

  @Column()
  @ApiProperty({ example: '2.0000' })
  maxAmount: string;

  @Column({ type: 'decimal', nullable: true })
  @ApiProperty({ example: 0.5 })
  solPowerRate: number;

  @Column({ default: false })
  @ApiProperty({ example: true })
  solPowerScaling: boolean;

  @Column()
  @ApiProperty({ example: 'SOL' })
  currency: string;

  @Column()
  @ApiProperty({ example: 'AEftAnw7UJLZx427q5AyaaA3XYzp9Kcw7MLu7yFJJgiA' })
  address: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 'AEftAnw7UJLZx427q5AyaaA3XYzp9Kcw7MLu7yFJJgiA',
  })
  smartcontractAddress: string;

  @Column({ type: 'decimal' })
  @ApiProperty({ example: 1 })
  emissionRatio: number;

  @Column({ type: 'timestamptz' })
  @ApiProperty()
  startDate: Date;

  @Column({ type: 'timestamptz' })
  @ApiProperty()
  endDate: Date;

  @ManyToOne(() => Project, (project) => project.rounds)
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
