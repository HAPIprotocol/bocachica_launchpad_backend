import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProjectPartner } from './project-partner.entity';
import { ProjectRound } from './project-round.entity';

export enum ProjectBlockchain {
  Solana = 'Solana',
  Ethereum = 'Ethereum',
  BSC = 'BSC',
}

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column()
  @ApiProperty({ example: 'Dyson Sphere' })
  title: string;

  @Column()
  @ApiProperty({ example: 'DSN' })
  ticker: string;

  @Column({ type: 'enum', enum: ProjectBlockchain })
  @ApiProperty({ example: 'solana', enum: ProjectBlockchain })
  blockchain: ProjectBlockchain;

  @Column()
  @ApiProperty({ example: 'AEftAnw7UJLZx427q5AyaaA3XYzp9Kcw7MLu7yFJJgiA' })
  smartContractAddress: string;

  @Column()
  @ApiProperty({
    example:
      'https://explorer.solana.com/address/AEftAnw7UJLZx427q5AyaaA3XYzp9Kcw7MLu7yFJJgiA',
  })
  smartContractUrl: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 'https://www.mylittleproject.example',
  })
  siteUrl?: string;

  @Column()
  @ApiProperty({ example: 'https://example.com/logo.png' })
  logoUrl: string;

  @Column()
  @ApiProperty({
    example:
      'A Dyson sphere is a hypothetical megastructure that completely encompasses a star and captures a large percentage of its power output.',
  })
  description: string;

  @OneToMany(() => ProjectPartner, (partner) => partner.project)
  @JoinColumn({ name: 'projectId' })
  partners: ProjectPartner[];

  @OneToMany(() => ProjectRound, (round) => round.project)
  @JoinColumn({ name: 'projectId' })
  rounds: ProjectRound[];
}
