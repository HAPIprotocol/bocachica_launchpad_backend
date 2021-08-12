import { MigrationInterface, QueryRunner } from 'typeorm';

export class projectSupply1628763143169 implements MigrationInterface {
  name = 'projectSupply1628763143169';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_round" ADD "projectIndex" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "totalSupply" bigint DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "decimals" integer NOT NULL DEFAULT '9'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "decimals"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "totalSupply"`);
    await queryRunner.query(
      `ALTER TABLE "project_round" DROP COLUMN "projectIndex"`,
    );
  }
}
