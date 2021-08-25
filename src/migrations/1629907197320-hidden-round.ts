import { MigrationInterface, QueryRunner } from 'typeorm';

export class hiddenRound1629907197320 implements MigrationInterface {
  name = 'hiddenRound1629907197320';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_d72ae3cd36826f2471881eed73"`);
    await queryRunner.query(
      `ALTER TYPE "project_round_status_enum" RENAME TO "project_round_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "project_round_status_enum" AS ENUM('pending', 'active', 'finished', 'hidden')`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" ALTER COLUMN "status" TYPE "project_round_status_enum" USING "status"::"text"::"project_round_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "project_round_status_enum_old"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_d72ae3cd36826f2471881eed73" ON "project_round" ("status", "accessType", "currency", "name", "allocationType") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_d72ae3cd36826f2471881eed73"`);
    await queryRunner.query(
      `CREATE TYPE "project_round_status_enum_old" AS ENUM('pending', 'active', 'finished')`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" ALTER COLUMN "status" TYPE "project_round_status_enum_old" USING "status"::"text"::"project_round_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "project_round_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "project_round_status_enum_old" RENAME TO "project_round_status_enum"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d72ae3cd36826f2471881eed73" ON "project_round" ("status", "accessType", "allocationType", "name", "currency") `,
    );
  }
}
