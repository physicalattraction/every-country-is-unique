import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1745008305308 implements MigrationInterface {
    name = 'Migration1745008305308';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "puzzle" ("id" SERIAL NOT NULL, "country_code" character varying(3), CONSTRAINT "PK_7c0a3dfb399417fd58ac1fdde6a" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "clue" ("id" SERIAL NOT NULL, "source" text NOT NULL, "key" text NOT NULL, "value" character varying NOT NULL, "puzzle_id" integer, CONSTRAINT "PK_fdfc59f3731665ca6fd7e7682d4" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "puzzle" ADD CONSTRAINT "FK_04b83b3e3ebf6bfda41ee686de0" FOREIGN KEY ("country_code") REFERENCES "country"("code") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "clue" ADD CONSTRAINT "FK_9eacfe525ef004cc56d092f732d" FOREIGN KEY ("puzzle_id") REFERENCES "puzzle"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clue" DROP CONSTRAINT "FK_9eacfe525ef004cc56d092f732d"`);
        await queryRunner.query(`ALTER TABLE "puzzle" DROP CONSTRAINT "FK_04b83b3e3ebf6bfda41ee686de0"`);
        await queryRunner.query(`DROP TABLE "clue"`);
        await queryRunner.query(`DROP TABLE "puzzle"`);
    }
}
