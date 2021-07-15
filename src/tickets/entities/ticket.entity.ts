import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column()
  publicKey: string;

  @Column()
  signature: string;

  @Column()
  message: string;

  @Column('timestamptz')
  timestamp: number;
}
