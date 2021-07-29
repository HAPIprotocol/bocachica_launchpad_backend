import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index(['publicKey', 'txHash'], { unique: true })
@Index(['roundId', 'publicKey', 'amount'])
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

  @Column({ type: 'bigint' })
  blocknumber: number;

  @Column({ type: 'timestamptz' })
  timestamp: Date;
}
