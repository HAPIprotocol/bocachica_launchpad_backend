import { MigrationInterface, QueryRunner } from 'typeorm';

export class init1626344366730 implements MigrationInterface {
  name = 'init1626344366730';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ticket" ("id" SERIAL NOT NULL, "projectId" integer NOT NULL, "publicKey" character varying NOT NULL, "signature" character varying NOT NULL, "message" character varying NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_d9a0835407701eb86f874474b7c" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ticket"`);
  }
}
