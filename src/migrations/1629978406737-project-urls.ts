import { MigrationInterface, QueryRunner } from 'typeorm';

export class projectUrls1629978406737 implements MigrationInterface {
  name = 'projectUrls1629978406737';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD "telegramUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "twitterUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD "mediumUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "mediumUrl"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "twitterUrl"`);
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "telegramUrl"`);
  }
}
