import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { StakeAccount } from './stake-account.entity';

@Entity()
@Index(['epoch'])
export class StakeReward {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  stakeAccountId: number;

  @Column({ type: 'bigint' })
  epoch: string;

  @Column({ type: 'bigint' })
  slot: string;

  @Column({ type: 'bigint' })
  amount: string;

  @ManyToOne(() => StakeAccount, (stakeAccount) => stakeAccount.rewards)
  @JoinColumn({ name: 'stakeAccountId' })
  stakeAccount: StakeAccount;
}
