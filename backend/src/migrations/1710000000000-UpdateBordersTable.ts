import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBordersTable1710000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing country_borders table
        await queryRunner.query(`DROP TABLE IF EXISTS "country_borders"`);

        // Create the new borders table
        await queryRunner.query(`
            CREATE TABLE "borders" (
                "country1Code" character varying NOT NULL,
                "country2Code" character varying NOT NULL,
                CONSTRAINT "PK_borders" PRIMARY KEY ("country1Code", "country2Code"),
                CONSTRAINT "CHK_country1_less_than_country2" CHECK ("country1Code" < "country2Code")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the new borders table
        await queryRunner.query(`DROP TABLE IF EXISTS "borders"`);

        // Recreate the old country_borders table
        await queryRunner.query(`
            CREATE TABLE "country_borders" (
                "country1_code" character varying NOT NULL,
                "country2_code" character varying NOT NULL,
                CONSTRAINT "PK_country_borders" PRIMARY KEY ("country1_code", "country2_code")
            )
        `);
    }
}
