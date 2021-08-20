import { MigrationInterface, QueryRunner } from 'typeorm';

export class projectParticipant1629457183630 implements MigrationInterface {
  name = 'projectParticipant1629457183630';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "project_participant" ("id" SERIAL NOT NULL, "roundId" integer NOT NULL, "publicKey" character varying NOT NULL, CONSTRAINT "PK_149de99a476203f813c3cb43a09" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_50bd325239133fc68f78c8677d" ON "project_participant" ("roundId", "publicKey") `,
    );
    await queryRunner.query(
      `ALTER TABLE "project_participant" ADD CONSTRAINT "FK_3472088bf4118891fda34cba6ab" FOREIGN KEY ("roundId") REFERENCES "project_round"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_participant" DROP CONSTRAINT "FK_3472088bf4118891fda34cba6ab"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_50bd325239133fc68f78c8677d"`);
    await queryRunner.query(`DROP TABLE "project_participant"`);
  }
}
