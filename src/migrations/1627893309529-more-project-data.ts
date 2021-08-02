import { MigrationInterface, QueryRunner } from 'typeorm';

export class moreProjectData1627893309529 implements MigrationInterface {
  name = 'moreProjectData1627893309529';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_round" ADD "emissionDate" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "siteUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "siteUrl"`);
    await queryRunner.query(
      `ALTER TABLE "project_round" DROP COLUMN "emissionDate"`,
    );
  }
}
