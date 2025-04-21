import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Country } from '../../country/entities/country.entity';
import { Currency } from '../../country/entities/currency.entity';
import { Language } from '../../country/entities/language.entity';
import { QueryCounter } from '../../utils/query-counter';
import { Clue } from '../entities/clue.entity';
import { Puzzle } from '../entities/puzzle.entity';
import { PuzzleService } from './puzzle.service';

describe('PuzzleService', () => {
    let service: PuzzleService;
    let puzzleRepository: Repository<Puzzle>;
    let clueRepository: Repository<Clue>;
    let countryRepository: Repository<Country>;
    let dataSource: DataSource;
    let queryCounter: QueryCounter;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'better-sqlite3',
                    database: ':memory:',
                    dropSchema: true,
                    entities: [Puzzle, Clue, Country, Currency, Language],
                    synchronize: true,
                    logging: false,
                }),
                TypeOrmModule.forFeature([Puzzle, Clue, Country]),
            ],
            providers: [
                PuzzleService,
                {
                    provide: Puzzle,
                    useFactory: dataSource => dataSource.getRepository(Puzzle),
                    inject: [getDataSourceToken()],
                },
                {
                    provide: Clue,
                    useFactory: dataSource => dataSource.getRepository(Clue),
                    inject: [getDataSourceToken()],
                },
                {
                    provide: Country,
                    useFactory: dataSource => dataSource.getRepository(Country),
                    inject: [getDataSourceToken()],
                },
            ],
        }).compile();

        service = module.get<PuzzleService>(PuzzleService);
        puzzleRepository = module.get<Repository<Puzzle>>(Puzzle);
        clueRepository = module.get<Repository<Clue>>(Clue);
        countryRepository = module.get<Repository<Country>>(Country);
        dataSource = module.get<DataSource>(getDataSourceToken());
        queryCounter = new QueryCounter(dataSource);

        // Create test countries
        await countryRepository.save([
            {
                code: 'QAT',
                name: 'Qatar',
                flag: '🇶🇦',
            },
            {
                code: 'OMN',
                name: 'Oman',
                flag: '🇴🇲',
            },
            {
                code: 'UAE',
                name: 'United Arab Emirates',
                flag: '🇦🇪',
            },
            {
                code: 'BHR',
                name: 'Bahrain',
                flag: '🇧🇭',
            },
            {
                code: 'KWT',
                name: 'Kuwait',
                flag: '🇰🇼',
            },
            {
                code: 'SAU',
                name: 'Saudi Arabia',
                flag: '🇸🇦',
            },
            {
                code: 'YEM',
                name: 'Yemen',
                flag: '🇾🇪',
            }
        ]);
    });

    beforeEach(async () => {
        // Clear all puzzles and clues before each test
        await clueRepository.delete({});
        await puzzleRepository.delete({});
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findOne', () => {
        it('should find a puzzle with its country and clues', async () => {
            // Arrange
            const country = await countryRepository.save({
                code: 'QAT',
                name: 'Qatar',
                flag: '🇶🇦',
            });

            const puzzle = await puzzleRepository.save({
                country,
                alternativeCountries: [],
                deduplicationKey: 'test-key'
            });

            const clues = [
                {
                    source: 'name',
                    key: 'has_nr_letters_lte',
                    value: '5',
                    puzzle,
                },
                {
                    source: 'population',
                    key: 'population_lt',
                    value: '3000000',
                    puzzle,
                },
            ];

            await clueRepository.save(clues);

            // Act
            const result = await service.findOne(puzzle.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe(puzzle.id);
            expect(result.country).toEqual(country);
            expect(result.clues).toHaveLength(2);
            expect(result.clues[0]).toMatchObject({
                source: 'name',
                key: 'has_nr_letters_lte',
                value: '5',
            });
            expect(result.clues[1]).toMatchObject({
                source: 'population',
                key: 'population_lt',
                value: '3000000',
            });
        });

        it('should return null for non-existent puzzle id', async () => {
            // Act
            const result = await service.findOne(999);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should throw error when creating puzzle with empty clues array', async () => {
            // Arrange
            await countryRepository.save({
                code: 'QAT',
                name: 'Qatar',
                flag: '🇶🇦',
            });

            // Act & Assert
            await expect(service.create('QAT', [], [], 'test-key')).rejects.toThrow(BadRequestException);
            await expect(service.create('QAT', [], [], 'test-key')).rejects.toThrow('A puzzle must have at least one clue');
        });

        it('should throw error when alternativeCountries array is empty', async () => {
            // Arrange
            await countryRepository.save({
                code: 'QAT',
                name: 'Qatar',
                flag: '🇶🇦',
            });

            const clues = [
                {
                    source: 'name',
                    key: 'has_nr_letters_lte',
                    value: '5',
                },
            ];

            // Act & Assert
            await expect(service.create('QAT', clues, [], 'test-key')).rejects.toThrow(BadRequestException);
            await expect(service.create('QAT', clues, [], 'test-key')).rejects.toThrow('Alternative countries array must have the same length as clues array');
        });

        it('should throw error when alternativeCountries array length does not match clues length', async () => {
            // Arrange
            await countryRepository.save({
                code: 'QAT',
                name: 'Qatar',
                flag: '🇶🇦',
            });

            const clues = [
                {
                    source: 'name',
                    key: 'has_nr_letters_lte',
                    value: '5',
                },
            ];

            const alternativeCountries = [
                ['OMN', 'UAE'],
                ['BHR', 'KWT'],  // Extra array that doesn't match clues length
            ];

            // Act & Assert
            await expect(service.create('QAT', clues, alternativeCountries, 'test-key')).rejects.toThrow(BadRequestException);
            await expect(service.create('QAT', clues, alternativeCountries, 'test-key')).rejects.toThrow('Alternative countries array must have the same length as clues array');
        });

        it('should throw error when alternativeCountries contains empty inner array', async () => {
            // Arrange
            await countryRepository.save({
                code: 'QAT',
                name: 'Qatar',
                flag: '🇶🇦',
            });

            const clues = [
                {
                    source: 'name',
                    key: 'has_nr_letters_lte',
                    value: '5',
                },
            ];

            const alternativeCountries = [
                [],
            ];

            // Act & Assert
            await expect(service.create('QAT', clues, alternativeCountries, 'test-key')).rejects.toThrow(BadRequestException);
            await expect(service.create('QAT', clues, alternativeCountries, 'test-key')).rejects.toThrow('Each inner array in alternativeCountries must contain at least one element');
        });

        it('should create a puzzle with clues and alternativeCountries', async () => {
            // Arrange
            const country = await countryRepository.save({
                code: 'QAT',
                name: 'Qatar',
                flag: '🇶🇦',
            });

            const clues = [
                {
                    source: 'name',
                    key: 'has_nr_letters_lte',
                    value: '5',
                },
                {
                    source: 'population',
                    key: 'population_lt',
                    value: '3000000',
                },
            ];

            const alternativeCountries = [
                ['OMN', 'UAE'],
                ['BHR', 'KWT'],
            ];

            // Act
            const result = await service.create('QAT', clues, alternativeCountries, 'test-key');

            // Assert
            expect(result).toBeDefined();
            expect(result.country).toEqual(country);
            expect(result.clues).toHaveLength(2);
            expect(result.alternativeCountries).toEqual(alternativeCountries);
            expect(result.clues[0]).toMatchObject({
                source: 'name',
                key: 'has_nr_letters_lte',
                value: '5',
            });
            expect(result.clues[1]).toMatchObject({
                source: 'population',
                key: 'population_lt',
                value: '3000000',
            });
        });

        it('should throw error for non-existent country code', async () => {
            await expect(service.create('XXX', [{ source: 'test', key: 'test', value: 'test' }], [['OMN', 'UAE']], 'test-key')).rejects.toThrow(
                'Country with code XXX not found',
            );
        });

        it('should throw error for invalid country codes in alternativeCountries', async () => {
            await countryRepository.save({
                code: 'QAT',
                name: 'Qatar',
                flag: '🇶🇦',
            });

            await expect(service.create('QAT', [{ source: 'test', key: 'test', value: 'test' }], [['INVALID', 'UAE']], 'test-key')).rejects.toThrow(
                'Invalid country codes found: INVALID',
            );
        });

        it('should preserve clue order', async () => {
            // Arrange
            await countryRepository.save({
                code: 'QAT',
                name: 'Qatar',
                flag: '🇶🇦',
            });

            const clues = [
                { source: 'first', key: 'key1', value: 'value1' },
                { source: 'second', key: 'key2', value: 'value2' },
                { source: 'third', key: 'key3', value: 'value3' },
            ];

            // Act
            const result = await service.create('QAT', clues, [['OMN', 'UAE'], ['BHR', 'KWT'], ['SAU', 'YEM']], 'test-key');

            // Assert
            expect(result.clues).toHaveLength(3);
            expect(result.clues[0].source).toBe('first');
            expect(result.clues[1].source).toBe('second');
            expect(result.clues[2].source).toBe('third');
        });

        it('should create multiple puzzles for the same country', async () => {
            // Arrange
            await countryRepository.save({
                code: 'QAT',
                name: 'Qatar',
                flag: '🇶🇦',
            });

            // Act
            const puzzle1 = await service.create('QAT', [{ source: 'test', key: 'key1', value: 'value1' }], [['OMN', 'UAE']], 'test-key-1');
            const puzzle2 = await service.create('QAT', [{ source: 'test', key: 'key2', value: 'value2' }], [['BHR', 'KWT']], 'test-key-2');

            // Assert
            expect(puzzle1.id).not.toBe(puzzle2.id);
            expect(puzzle1.country.code).toBe('QAT');
            expect(puzzle2.country.code).toBe('QAT');
            expect(puzzle1.clues[0].value).toBe('value1');
            expect(puzzle2.clues[0].value).toBe('value2');
        });

        it('should make exactly 8 database queries when creating a puzzle', async () => {
            // Arrange
            await countryRepository.save({
                code: 'QAT',
                name: 'Qatar',
                flag: '🇶🇦',
            });

            const clues = [
                {
                    source: 'name',
                    key: 'has_nr_letters_lte',
                    value: '5',
                },
                {
                    source: 'population',
                    key: 'population_lt',
                    value: '3000000',
                },
            ];

            const alternativeCountries = [
                ['OMN', 'UAE'],
                ['BHR', 'KWT'],
            ];

            // Act
            queryCounter.startCounting();
            await service.create('QAT', clues, alternativeCountries, 'test-key');
            const queryCount = queryCounter.stopQueryCount();

            // Assert
            // The create operation makes 8 queries:
            // 1. Check if puzzle with hash exists
            // 2. Get distinct puzzle IDs for hash check
            // 3. Get full puzzle data for hash check
            // 4. SELECT "Country"."code" - Get all countries (including target country)
            // 5. BEGIN TRANSACTION
            // 6. INSERT INTO "puzzle" - Insert puzzle
            // 7. INSERT INTO "clue" - Bulk insert clues
            // 8. COMMIT
            expect(queryCounter.verifyQueryCount(8)).toBe(true);
        });
    });
});
