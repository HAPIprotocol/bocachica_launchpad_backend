import { MigrationInterface, QueryRunner } from 'typeorm';

export class ticketRounds1627658877919 implements MigrationInterface {
  name = 'ticketRounds1627658877919';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD "roundId" integer NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN "roundId"`);
  }
}
