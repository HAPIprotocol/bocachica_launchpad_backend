import { MigrationInterface, QueryRunner } from 'typeorm';

export class roundIcon1629459026888 implements MigrationInterface {
  name = 'roundIcon1629459026888';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_round" ADD "tokenIcon" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_round" DROP COLUMN "tokenIcon"`,
    );
  }
}
