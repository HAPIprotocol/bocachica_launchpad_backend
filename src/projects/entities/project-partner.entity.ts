import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Project } from './project.entity';

@Entity()
export class ProjectPartner {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column()
  @ApiProperty({ example: 101 })
  projectId: number;

  @Column()
  @ApiProperty({ example: 'Planetary Construction LTD' })
  name: string;

  @Column()
  @ApiProperty({ example: 'https://planetary-construction.space/logo.png' })
  logoUrl: string;

  @Column()
  @ApiProperty({ example: 'https://planetary-construction.space' })
  siteUrl: string;

  @Column()
  @ApiProperty({ example: 1 })
  order: number;

  @ManyToOne(() => Project, (project) => project.partners)
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
