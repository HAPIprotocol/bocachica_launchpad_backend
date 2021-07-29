import { MigrationInterface, QueryRunner } from 'typeorm';

export class projectsSolpower1627571300275 implements MigrationInterface {
  name = 'projectsSolpower1627571300275';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "project_contribution" ("id" SERIAL NOT NULL, "roundId" integer NOT NULL, "publicKey" character varying NOT NULL, "amount" bigint NOT NULL, "txHash" character varying NOT NULL, "blocknumber" bigint NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_fb9796a2aef161a5bcd450a0fbd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_def7c6beb2b7b749202141662f" ON "project_contribution" ("roundId", "publicKey", "amount") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8e379a546fcf9546fc25167863" ON "project_contribution" ("publicKey", "txHash") `,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" ADD "collectedAmount" bigint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" ADD "maxAmount" bigint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" ADD "solPowerRate" numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" ADD "solPowerScaling" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" ADD "decimals" integer NOT NULL DEFAULT '9'`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" ADD "emissionRatio" numeric NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" DROP COLUMN "targetAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" ADD "targetAmount" bigint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" DROP COLUMN "minAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" ADD "minAmount" bigint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" ALTER COLUMN "smartcontractAddress" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_round" ALTER COLUMN "smartcontractAddress" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" DROP COLUMN "minAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" ADD "minAmount" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" DROP COLUMN "targetAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" ADD "targetAmount" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" DROP COLUMN "emissionRatio"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" DROP COLUMN "decimals"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" DROP COLUMN "solPowerScaling"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" DROP COLUMN "solPowerRate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" DROP COLUMN "maxAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" DROP COLUMN "collectedAmount"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_8e379a546fcf9546fc25167863"`);
    await queryRunner.query(`DROP INDEX "IDX_def7c6beb2b7b749202141662f"`);
    await queryRunner.query(`DROP TABLE "project_contribution"`);
  }
}
