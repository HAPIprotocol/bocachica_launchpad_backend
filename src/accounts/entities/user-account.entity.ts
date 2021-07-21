import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { StakeAccount } from './stake-account.entity';

@Entity()
export class UserAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  publicKey: string;

  // SOL balance
  @Column({ type: 'bigint', nullable: true })
  balance: string;

  // Total SolPower
  @Column({ type: 'bigint', nullable: true })
  solPowerAmount: string;

  // Last epoch SolPower has been calculated for
  @Column({ type: 'bigint', nullable: true })
  solPowerEpoch: string;

  @Column({ default: true })
  isUpdateNeeded: boolean;

  @OneToMany(() => StakeAccount, (stakeAccount) => stakeAccount.userAccount)
  @JoinColumn({ name: 'userAccountId' })
  stakeAccounts: StakeAccount[];
}
