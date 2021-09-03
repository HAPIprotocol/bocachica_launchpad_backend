import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum ProjectContributionStatus {
  Failure = 'failure',
  Pending = 'pending',
  Success = 'success',
}

@Entity()
@Index(['publicKey', 'txHash'], { unique: true })
@Index(['roundId', 'publicKey', 'amount'])
@Index(['publicKey', 'txHash', 'status'])
export class ProjectContribution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roundId: number;

  @Column()
  publicKey: string;

  @Column({ type: 'bigint' })
  amount: string;

  @Column()
  txHash: string;

  @Column({ type: 'bigint', nullable: true })
  blocknumber: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({
    type: 'enum',
    enum: ProjectContributionStatus,
    default: ProjectContributionStatus.Pending,
  })
  status: ProjectContributionStatus = ProjectContributionStatus.Pending;
}
