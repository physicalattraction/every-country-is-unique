import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1743268591695 implements MigrationInterface {
    name = 'InitialSchema1743268591695';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "currency" ("code" character varying(3) NOT NULL, "name" character varying NOT NULL, "symbol" character varying NOT NULL, CONSTRAINT "PK_723472e41cae44beb0763f4039c" PRIMARY KEY ("code"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "language" ("code" character varying(3) NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_465b3173cdddf0ac2d3fe73a33c" PRIMARY KEY ("code"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "country" ("code" character varying(3) NOT NULL, "name" character varying NOT NULL, "flag" character varying NOT NULL, CONSTRAINT "PK_8ff4c23dc9a3f3856555bd86186" PRIMARY KEY ("code"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "country_currencies" ("country_code" character varying(3) NOT NULL, "currency_code" character varying(3) NOT NULL, CONSTRAINT "PK_fb183ba5ecd7cf3b14f5133dc3f" PRIMARY KEY ("country_code", "currency_code"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_86cd375db2acd17920fa93926f" ON "country_currencies" ("country_code") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_27b8ee06a17524d6f5cf1703d4" ON "country_currencies" ("currency_code") `,
        );
        await queryRunner.query(
            `CREATE TABLE "country_languages" ("country_code" character varying(3) NOT NULL, "language_code" character varying(3) NOT NULL, CONSTRAINT "PK_ab210f97c311320ae47ce74623f" PRIMARY KEY ("country_code", "language_code"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_91f971fe2464172d3dbd39add2" ON "country_languages" ("country_code") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_88ff205e96b860102bee4e4983" ON "country_languages" ("language_code") `,
        );
        await queryRunner.query(
            `ALTER TABLE "country_currencies" ADD CONSTRAINT "FK_86cd375db2acd17920fa93926fe" FOREIGN KEY ("country_code") REFERENCES "country"("code") ON DELETE CASCADE ON UPDATE CASCADE`,
        );
        await queryRunner.query(
            `ALTER TABLE "country_currencies" ADD CONSTRAINT "FK_27b8ee06a17524d6f5cf1703d48" FOREIGN KEY ("currency_code") REFERENCES "currency"("code") ON DELETE CASCADE ON UPDATE CASCADE`,
        );
        await queryRunner.query(
            `ALTER TABLE "country_languages" ADD CONSTRAINT "FK_91f971fe2464172d3dbd39add2c" FOREIGN KEY ("country_code") REFERENCES "country"("code") ON DELETE CASCADE ON UPDATE CASCADE`,
        );
        await queryRunner.query(
            `ALTER TABLE "country_languages" ADD CONSTRAINT "FK_88ff205e96b860102bee4e4983d" FOREIGN KEY ("language_code") REFERENCES "language"("code") ON DELETE CASCADE ON UPDATE CASCADE`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "country_languages" DROP CONSTRAINT "FK_88ff205e96b860102bee4e4983d"`);
        await queryRunner.query(`ALTER TABLE "country_languages" DROP CONSTRAINT "FK_91f971fe2464172d3dbd39add2c"`);
        await queryRunner.query(`ALTER TABLE "country_currencies" DROP CONSTRAINT "FK_27b8ee06a17524d6f5cf1703d48"`);
        await queryRunner.query(`ALTER TABLE "country_currencies" DROP CONSTRAINT "FK_86cd375db2acd17920fa93926fe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88ff205e96b860102bee4e4983"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_91f971fe2464172d3dbd39add2"`);
        await queryRunner.query(`DROP TABLE "country_languages"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_27b8ee06a17524d6f5cf1703d4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_86cd375db2acd17920fa93926f"`);
        await queryRunner.query(`DROP TABLE "country_currencies"`);
        await queryRunner.query(`DROP TABLE "country"`);
        await queryRunner.query(`DROP TABLE "language"`);
        await queryRunner.query(`DROP TABLE "currency"`);
    }
}
