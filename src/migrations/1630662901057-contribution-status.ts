import { MigrationInterface, QueryRunner } from 'typeorm';

export class contributionStatus1630662901057 implements MigrationInterface {
  name = 'contributionStatus1630662901057';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "project_contribution_status_enum" AS ENUM('failure', 'pending', 'success')`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_contribution" ADD "status" "project_contribution_status_enum" NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_contribution" ALTER COLUMN "blocknumber" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_contribution" ALTER COLUMN "timestamp" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0e48356c35a9f68ea8e60ae597" ON "project_contribution" ("publicKey", "txHash", "status") `,
    );
    await queryRunner.query(
      `UPDATE TABLE "project_contribution" SET "status" = 'success'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_0e48356c35a9f68ea8e60ae597"`);
    await queryRunner.query(
      `ALTER TABLE "project_contribution" ALTER COLUMN "timestamp" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_contribution" ALTER COLUMN "blocknumber" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_contribution" DROP COLUMN "status"`,
    );
    await queryRunner.query(`DROP TYPE "project_contribution_status_enum"`);
  }
}
