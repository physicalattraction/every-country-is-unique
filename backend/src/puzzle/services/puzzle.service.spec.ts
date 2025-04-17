import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Country } from '../../country/entities/country.entity';
import { Currency } from '../../country/entities/currency.entity';
import { Language } from '../../country/entities/language.entity';
import { Clue } from '../entities/clue.entity';
import { Puzzle } from '../entities/puzzle.entity';
import { PuzzleService } from './puzzle.service';

describe('PuzzleService', () => {
    let service: PuzzleService;
    let puzzleRepository: Repository<Puzzle>;
    let clueRepository: Repository<Clue>;
    let countryRepository: Repository<Country>;

    beforeEach(async () => {
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

            const puzzle = await puzzleRepository.save({ country });

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
            await expect(service.create('QAT', [])).rejects.toThrow(BadRequestException);
            await expect(service.create('QAT', [])).rejects.toThrow('A puzzle must have at least one clue');
        });

        it('should create a puzzle with clues', async () => {
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

            // Act
            const result = await service.create('QAT', clues);

            // Assert
            expect(result).toBeDefined();
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

        it('should throw error for non-existent country code', async () => {
            // Act & Assert
            await expect(service.create('XXX', [{ source: 'test', key: 'key1', value: 'value1' }])).rejects.toThrow(
                'Country with code XXX not found',
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
            const result = await service.create('QAT', clues);

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
            const puzzle1 = await service.create('QAT', [{ source: 'test', key: 'key1', value: 'value1' }]);
            const puzzle2 = await service.create('QAT', [{ source: 'test', key: 'key2', value: 'value2' }]);

            // Assert
            expect(puzzle1.id).not.toBe(puzzle2.id);
            expect(puzzle1.country.code).toBe('QAT');
            expect(puzzle2.country.code).toBe('QAT');
            expect(puzzle1.clues[0].value).toBe('value1');
            expect(puzzle2.clues[0].value).toBe('value2');
        });
    });
});
