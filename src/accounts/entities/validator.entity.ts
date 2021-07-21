import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Validator {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  voteAccount: string;

  @Column()
  identityAccount: string;

  @Column()
  isWhitelisted: boolean;
}
