import { BadRequestException, NotFoundException } from '@nestjs/common';
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
            },
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
                deduplicationKey: 'test-key',
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
            expect(result.country).toMatchObject({
                code: 'QAT',
                name: 'Qatar',
                flag: '🇶🇦',
            });
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
            await expect(service.create('QAT', [], [], 'test-key')).rejects.toThrow(
                'A puzzle must have at least one clue',
            );
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
            await expect(service.create('QAT', clues, [], 'test-key')).rejects.toThrow(
                'Alternative countries array must have the same length as clues array',
            );
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
                ['BHR', 'KWT'], // Extra array that doesn't match clues length
            ];

            // Act & Assert
            await expect(service.create('QAT', clues, alternativeCountries, 'test-key')).rejects.toThrow(
                BadRequestException,
            );
            await expect(service.create('QAT', clues, alternativeCountries, 'test-key')).rejects.toThrow(
                'Alternative countries array must have the same length as clues array',
            );
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

            const alternativeCountries = [[]];

            // Act & Assert
            await expect(service.create('QAT', clues, alternativeCountries, 'test-key')).rejects.toThrow(
                BadRequestException,
            );
            await expect(service.create('QAT', clues, alternativeCountries, 'test-key')).rejects.toThrow(
                'Each inner array in alternativeCountries must contain at least one element',
            );
        });

        it('should create a puzzle with clues and alternativeCountries', async () => {
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
            const result = await service.create('QAT', clues, alternativeCountries, 'test-key');

            // Assert
            expect(result).toBeDefined();
            expect(result.country).toMatchObject({
                code: 'QAT',
                name: 'Qatar',
                flag: '🇶🇦',
            });
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
            await expect(
                service.create('XXX', [{ source: 'test', key: 'test', value: 'test' }], [['OMN', 'UAE']], 'test-key'),
            ).rejects.toThrow('Country with code XXX not found');
        });

        it('should throw error for invalid country codes in alternativeCountries', async () => {
            await countryRepository.save({
                code: 'QAT',
                name: 'Qatar',
                flag: '🇶🇦',
            });

            await expect(
                service.create(
                    'QAT',
                    [{ source: 'test', key: 'test', value: 'test' }],
                    [['INVALID', 'UAE']],
                    'test-key',
                ),
            ).rejects.toThrow('Invalid country codes found: INVALID');
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
            const result = await service.create(
                'QAT',
                clues,
                [
                    ['OMN', 'UAE'],
                    ['BHR', 'KWT'],
                    ['SAU', 'YEM'],
                ],
                'test-key',
            );

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
            const puzzle1 = await service.create(
                'QAT',
                [{ source: 'test', key: 'key1', value: 'value1' }],
                [['OMN', 'UAE']],
                'test-key-1',
            );
            const puzzle2 = await service.create(
                'QAT',
                [{ source: 'test', key: 'key2', value: 'value2' }],
                [['BHR', 'KWT']],
                'test-key-2',
            );

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

            // Assert
            // The create operation makes 8 queries:
            // 1. SELECT puzzle by deduplication key (distinct alias)
            // 2. SELECT countries by requested codes (target + alternatives)
            // 3. BEGIN TRANSACTION
            // 4. INSERT INTO "puzzle"
            // 5. INSERT INTO "clue"
            // 6. COMMIT
            // 7. SELECT puzzle by id (distinct alias)
            // 8. SELECT full puzzle with relations
            expect(queryCounter.verifyQueryCount(8)).toBe(true);
        });

        it('should return existing puzzle when deduplication key already exists', async () => {
            const clues = [{ source: 'name', key: 'has_nr_letters_lte', value: '5' }];
            const alternativeCountries = [['OMN', 'UAE']];

            const first = await service.create('QAT', clues, alternativeCountries, 'dup-key');
            const second = await service.create(
                'QAT',
                [{ source: 'other', key: 'other', value: 'other' }],
                [['BHR', 'KWT']],
                'dup-key',
            );

            expect(second.id).toBe(first.id);
            expect(second.clues[0].source).toBe('name');
        });

        it('should throw NotFoundException when puzzle disappears after create', async () => {
            const findOneSpy = jest.spyOn(service, 'findOne').mockResolvedValueOnce(null);

            await expect(
                service.create('QAT', [{ source: 'test', key: 'test', value: 'test' }], [['OMN', 'UAE']], 'ghost-key'),
            ).rejects.toThrow(NotFoundException);

            findOneSpy.mockRestore();
        });
    });

    describe('update', () => {
        it('should update a puzzle clues and alternative countries', async () => {
            const created = await service.create(
                'QAT',
                [{ source: 'name', key: 'has_nr_letters_lte', value: '5' }],
                [['OMN', 'UAE']],
                'update-key',
            );

            const updated = await service.update(
                created.id,
                'QAT',
                [{ source: 'population', key: 'population_lt', value: '3000000' }],
                [['BHR', 'KWT']],
            );

            expect(updated.id).toBe(created.id);
            expect(updated.clues).toHaveLength(1);
            expect(updated.clues[0]).toMatchObject({
                source: 'population',
                key: 'population_lt',
                value: '3000000',
            });
            expect(updated.alternativeCountries).toEqual([['BHR', 'KWT']]);
        });

        it('should throw NotFoundException when puzzle does not exist', async () => {
            await expect(
                service.update(999, 'QAT', [{ source: 'test', key: 'test', value: 'test' }], [['OMN', 'UAE']]),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when puzzle disappears after update', async () => {
            const created = await service.create(
                'QAT',
                [{ source: 'name', key: 'has_nr_letters_lte', value: '5' }],
                [['OMN', 'UAE']],
                'update-ghost-key',
            );

            const findOneSpy = jest
                .spyOn(service, 'findOne')
                .mockResolvedValueOnce(created)
                .mockResolvedValueOnce(null);

            await expect(
                service.update(
                    created.id,
                    'QAT',
                    [{ source: 'population', key: 'population_lt', value: '1' }],
                    [['BHR', 'KWT']],
                ),
            ).rejects.toThrow(NotFoundException);

            findOneSpy.mockRestore();
        });
    });

    describe('delete', () => {
        it('should delete an existing puzzle', async () => {
            const created = await service.create(
                'QAT',
                [{ source: 'name', key: 'has_nr_letters_lte', value: '5' }],
                [['OMN', 'UAE']],
                'delete-key',
            );

            await service.delete(created.id);

            expect(await service.findOne(created.id)).toBeNull();
        });

        it('should throw NotFoundException when puzzle does not exist', async () => {
            await expect(service.delete(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('findMany', () => {
        it('should return paginated puzzles', async () => {
            await service.create('QAT', [{ source: 'a', key: 'a', value: 'a' }], [['OMN', 'UAE']], 'find-many-1');
            await service.create('QAT', [{ source: 'b', key: 'b', value: 'b' }], [['BHR', 'KWT']], 'find-many-2');

            const result = await service.findMany(undefined, 1, 1);

            expect(result.total).toBe(2);
            expect(result.puzzles).toHaveLength(1);
        });

        it('should filter by country code', async () => {
            await service.create('QAT', [{ source: 'a', key: 'a', value: 'a' }], [['OMN', 'UAE']], 'find-many-qat');

            const result = await service.findMany('QAT');

            expect(result.total).toBe(1);
            expect(result.puzzles[0].country.code).toBe('QAT');
        });
    });

    describe('findRandom', () => {
        it('should return a random puzzle', async () => {
            const created = await service.create(
                'QAT',
                [{ source: 'name', key: 'has_nr_letters_lte', value: '5' }],
                [['OMN', 'UAE']],
                'random-key',
            );

            const result = await service.findRandom();

            expect(result.id).toBe(created.id);
            expect(result.country.code).toBe('QAT');
            expect(result.clues).toHaveLength(1);
        });

        it('should throw NotFoundException when no puzzles exist', async () => {
            await expect(service.findRandom()).rejects.toThrow(NotFoundException);
            await expect(service.findRandom()).rejects.toThrow('No puzzles found');
        });

        it('should throw NotFoundException when random query returns no puzzle', async () => {
            await service.create(
                'QAT',
                [{ source: 'name', key: 'has_nr_letters_lte', value: '5' }],
                [['OMN', 'UAE']],
                'random-ghost-key',
            );

            const countSpy = jest.spyOn(puzzleRepository, 'count').mockResolvedValueOnce(1);
            const getOneSpy = jest.fn().mockResolvedValue(null);
            const queryBuilderSpy = jest.spyOn(puzzleRepository, 'createQueryBuilder').mockReturnValueOnce({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getOne: getOneSpy,
            } as never);

            await expect(service.findRandom()).rejects.toThrow('No puzzle found');

            countSpy.mockRestore();
            queryBuilderSpy.mockRestore();
        });
    });
});
