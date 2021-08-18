import { MigrationInterface, QueryRunner } from 'typeorm';

export class roundSolpowerCheck1629305203830 implements MigrationInterface {
  name = 'roundSolpowerCheck1629305203830';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_round" ADD "solPowerCheck" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_round" DROP COLUMN "solPowerCheck"`,
    );
  }
}
