import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index(['voteAccount', 'identityAccount', 'isWhitelisted'])
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
