import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAlternativeCountries1745008305309 implements MigrationInterface {
    name = 'AddAlternativeCountries1745008305309'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (queryRunner.connection.options.type === 'postgres') {
            await queryRunner.query(
                `ALTER TABLE "puzzle" ADD "alternative_countries" jsonb`
            );
        } else {
            await queryRunner.query(
                `ALTER TABLE "puzzle" ADD "alternative_countries" text`
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "puzzle" DROP COLUMN "alternative_countries"`
        );
    }
} 