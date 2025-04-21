import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeduplicationKeyToPuzzle1745008305309 implements MigrationInterface {
    name = 'AddDeduplicationKeyToPuzzle1745008305309';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "puzzle" ADD "deduplicationKey" character varying(32) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "puzzle" ADD CONSTRAINT "UQ_puzzle_deduplication_key" UNIQUE ("deduplicationKey")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "puzzle" DROP CONSTRAINT "UQ_puzzle_deduplication_key"`);
        await queryRunner.query(`ALTER TABLE "puzzle" DROP COLUMN "deduplicationKey"`);
    }
} 