import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { StakeReward } from './stake-rewards.entity';
import { UserAccount } from './user-account.entity';

@Entity()
export class StakeAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userAccountId: number;

  @Column({ nullable: true })
  validatorId: number;

  @Column()
  publicKey: string;

  @ManyToOne(() => UserAccount, (userAccount) => userAccount.stakeAccounts)
  @JoinColumn({ name: 'userAccountId' })
  userAccount: UserAccount;

  @OneToMany(() => StakeReward, (stakeReward) => stakeReward.stakeAccount)
  @JoinColumn({ name: 'userAccountId' })
  rewards: StakeReward[];
}
