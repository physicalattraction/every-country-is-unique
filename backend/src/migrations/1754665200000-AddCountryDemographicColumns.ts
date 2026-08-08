import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCountryDemographicColumns1754665200000 implements MigrationInterface {
    name = 'AddCountryDemographicColumns1754665200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "country" ADD "population" double precision`);
        await queryRunner.query(`ALTER TABLE "country" ADD "area" double precision`);
        await queryRunner.query(`ALTER TABLE "country" ADD "population_density" double precision`);
        await queryRunner.query(`ALTER TABLE "country" ADD "is_landlocked" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "country" DROP COLUMN "is_landlocked"`);
        await queryRunner.query(`ALTER TABLE "country" DROP COLUMN "population_density"`);
        await queryRunner.query(`ALTER TABLE "country" DROP COLUMN "area"`);
        await queryRunner.query(`ALTER TABLE "country" DROP COLUMN "population"`);
    }
}
