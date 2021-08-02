import { MigrationInterface, QueryRunner } from 'typeorm';

export class moreProjectData1627892543044 implements MigrationInterface {
  name = 'moreProjectData1627892543044';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_round" ADD "emissionDate" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "siteUrl" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" ALTER COLUMN "emissionDate" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "siteUrl" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ALTER COLUMN "siteUrl" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" ALTER COLUMN "emissionDate" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "siteUrl"`);
    await queryRunner.query(
      `ALTER TABLE "project_round" DROP COLUMN "emissionDate"`,
    );
  }
}
