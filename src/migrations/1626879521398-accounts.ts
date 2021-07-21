import { MigrationInterface, QueryRunner } from 'typeorm';

export class accounts1626879521398 implements MigrationInterface {
  name = 'accounts1626879521398';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "stake_reward" ("id" SERIAL NOT NULL, "stakeAccountId" integer NOT NULL, "epoch" bigint NOT NULL, "slot" bigint NOT NULL, "amount" bigint NOT NULL, CONSTRAINT "PK_528337daf0fc99be060e537a827" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_account" ("id" SERIAL NOT NULL, "publicKey" character varying NOT NULL, "balance" bigint, "solPowerAmount" bigint, "solPowerEpoch" bigint, "isUpdateNeeded" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_6acfec7285fdf9f463462de3e9f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "stake_account" ("id" SERIAL NOT NULL, "userAccountId" integer NOT NULL, "validatorId" integer, "publicKey" character varying NOT NULL, CONSTRAINT "PK_48a0a4f6ef7ee7a7395cdce1a2a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "validator" ("id" SERIAL NOT NULL, "voteAccount" character varying NOT NULL, "identityAccount" character varying NOT NULL, "isWhitelisted" boolean NOT NULL, CONSTRAINT "PK_ae0a943022c24bd60e7161e0fad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "stake_reward" ADD CONSTRAINT "FK_15c95ed2ad895f4fbaafb962f7c" FOREIGN KEY ("stakeAccountId") REFERENCES "stake_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stake_account" ADD CONSTRAINT "FK_b74515040dc881f6b66ce882648" FOREIGN KEY ("userAccountId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stake_account" DROP CONSTRAINT "FK_b74515040dc881f6b66ce882648"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stake_reward" DROP CONSTRAINT "FK_15c95ed2ad895f4fbaafb962f7c"`,
    );
    await queryRunner.query(`DROP TABLE "validator"`);
    await queryRunner.query(`DROP TABLE "stake_account"`);
    await queryRunner.query(`DROP TABLE "user_account"`);
    await queryRunner.query(`DROP TABLE "stake_reward"`);
  }
}
