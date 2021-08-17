import { MigrationInterface, QueryRunner } from 'typeorm';

export class addIndexes1629213585035 implements MigrationInterface {
  name = 'addIndexes1629213585035';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_459a1604e4ccd97e20cad6bcb0" ON "stake_reward" ("epoch") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1fd040a05b5b340222749cfe4c" ON "user_account" ("publicKey") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a2390c5323670094c6221757d4" ON "stake_account" ("publicKey") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_be3adade01cbac0b574f082c1e" ON "validator" ("voteAccount", "identityAccount", "isWhitelisted") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d72ae3cd36826f2471881eed73" ON "project_round" ("status", "accessType", "currency", "name", "allocationType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6c1448e552efe7a068663d40d2" ON "ticket" ("projectId", "roundId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2d7920b43f20ff2026702f388b" ON "ticket" ("publicKey") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_2d7920b43f20ff2026702f388b"`);
    await queryRunner.query(`DROP INDEX "IDX_6c1448e552efe7a068663d40d2"`);
    await queryRunner.query(`DROP INDEX "IDX _d72ae3cd36826f2471881eed73"`);
    await queryRunner.query(`DROP INDEX "IDX_be3adade01cbac0b574f082c1e"`);
    await queryRunner.query(`DROP INDEX "IDX_a2390c5323670094c6221757d4"`);
    await queryRunner.query(`DROP INDEX "IDX_1fd040a05b5b340222749cfe4c"`);
    await queryRunner.query(`DROP INDEX "IDX_459a1604e4ccd97e20cad6bcb0"`);
  }
}
