import { MigrationInterface, QueryRunner } from 'typeorm';

export class projects1626787785341 implements MigrationInterface {
  name = 'projects1626787785341';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "project_round_status_enum" AS ENUM('pending', 'active', 'finished')`,
    );
    await queryRunner.query(
      `CREATE TYPE "project_round_accesstype_enum" AS ENUM('private', 'public')`,
    );
    await queryRunner.query(
      `CREATE TYPE "project_round_allocationtype_enum" AS ENUM('by_amount', 'by_subscription')`,
    );
    await queryRunner.query(
      `CREATE TABLE "project_round" ("id" SERIAL NOT NULL, "projectId" integer NOT NULL, "status" "project_round_status_enum" NOT NULL, "accessType" "project_round_accesstype_enum" NOT NULL, "allocationType" "project_round_allocationtype_enum" NOT NULL, "name" character varying NOT NULL, "targetAmount" character varying NOT NULL, "minAmount" character varying NOT NULL, "currency" character varying NOT NULL, "address" character varying NOT NULL, "smartcontractAddress" character varying NOT NULL, "startDate" TIMESTAMP WITH TIME ZONE NOT NULL, "endDate" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_7151eb30971c3c1db11dbc54509" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "project_blockchain_enum" AS ENUM('Solana', 'Ethereum', 'BSC')`,
    );
    await queryRunner.query(
      `CREATE TABLE "project" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "ticker" character varying NOT NULL, "blockchain" "project_blockchain_enum" NOT NULL, "smartContractAddress" character varying NOT NULL, "smartContractUrl" character varying NOT NULL, "logoUrl" character varying NOT NULL, "description" character varying NOT NULL, CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "project_partner" ("id" SERIAL NOT NULL, "projectId" integer NOT NULL, "name" character varying NOT NULL, "logoUrl" character varying NOT NULL, "siteUrl" character varying NOT NULL, "order" integer NOT NULL, CONSTRAINT "PK_fbacecdfc536b917481a618772f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" ADD CONSTRAINT "FK_2a0eda06c7d189f405be89fc719" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_partner" ADD CONSTRAINT "FK_45181752626a6ccec6c8613abca" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_partner" DROP CONSTRAINT "FK_45181752626a6ccec6c8613abca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_round" DROP CONSTRAINT "FK_2a0eda06c7d189f405be89fc719"`,
    );
    await queryRunner.query(`DROP TABLE "project_partner"`);
    await queryRunner.query(`DROP TABLE "project"`);
    await queryRunner.query(`DROP TYPE "project_blockchain_enum"`);
    await queryRunner.query(`DROP TABLE "project_round"`);
    await queryRunner.query(`DROP TYPE "project_round_allocationtype_enum"`);
    await queryRunner.query(`DROP TYPE "project_round_accesstype_enum"`);
    await queryRunner.query(`DROP TYPE "project_round_status_enum"`);
  }
}
