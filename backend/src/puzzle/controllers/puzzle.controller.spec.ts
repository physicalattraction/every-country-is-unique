import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';

import { Country } from '../../country/entities/country.entity';
import { Currency } from '../../country/entities/currency.entity';
import { Language } from '../../country/entities/language.entity';
import { QueryCounter } from '../../utils/query-counter';
import { CreatePuzzleDto } from '../dto/create-puzzle.dto';
import { Clue } from '../entities/clue.entity';
import { Puzzle } from '../entities/puzzle.entity';
import { PuzzleModule } from '../puzzle.module';
import { PuzzleService } from '../services/puzzle.service';
import {
    createTestContext,
    createTestCountry,
    createTestPuzzle,
    TestRepositoryContext,
} from '../test/puzzle.test-helpers';
import { PuzzleController } from './puzzle.controller';

describe('PuzzleController', () => {
    let app: INestApplication;
    let context: TestRepositoryContext;
    let controller: PuzzleController;
    let puzzleRepository: Repository<Puzzle>;
    let countryRepository: Repository<Country>;
    let dataSource: DataSource;
    let queryCounter: QueryCounter;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'better-sqlite3',
                    database: ':memory:',
                    dropSchema: true,
                    entities: [Puzzle, Clue, Country, Currency, Language],
                    synchronize: true,
                }),
                PuzzleModule,
                TypeOrmModule.forFeature([Puzzle, Clue, Country]),
            ],
            controllers: [PuzzleController],
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

        app = module.createNestApplication();
        await app.init();

        context = createTestContext(
            module.get<Repository<Puzzle>>(Puzzle),
            module.get<Repository<Clue>>(Clue),
            module.get<Repository<Country>>(Country),
        );

        controller = module.get<PuzzleController>(PuzzleController);
        puzzleRepository = module.get<Repository<Puzzle>>(Puzzle);
        countryRepository = module.get<Repository<Country>>(Country);
        dataSource = module.get<DataSource>(getDataSourceToken());
        queryCounter = new QueryCounter(dataSource);
    });

    afterEach(async () => {
        await app.close();
    });

    describe('GET /puzzles/:id', () => {
        it('should return a puzzle with its country and clues', async () => {
            // Arrange
            const puzzle = await createTestPuzzle(context);

            // Act
            const response = await request(app.getHttpServer()).get(`/puzzles/${puzzle.id}`).expect(200);

            // Assert
            expect(response.body).toEqual({
                id: puzzle.id,
                country: {
                    code: 'QAT',
                    name: 'Qatar',
                    flag: '🇶🇦',
                },
                clues: [
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
                ],
            });
        });

        it('should return 404 for non-existent puzzle', async () => {
            await request(app.getHttpServer()).get('/puzzles/999').expect(404);
        });
    });

    describe('POST /puzzles', () => {
        it('should create a new puzzle with clues', async () => {
            // Arrange
            await createTestPuzzle(context, { skipClues: true });

            const createPuzzleDto: CreatePuzzleDto = {
                country_code: 'QAT',
                clues: [
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
                ],
            };

            // Act
            const response = await request(app.getHttpServer()).post('/puzzles').send(createPuzzleDto).expect(201);

            // Assert
            expect(response.body).toMatchObject({
                country: {
                    code: 'QAT',
                    name: 'Qatar',
                    flag: '🇶🇦',
                },
                clues: [
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
                ],
            });

            // Verify database state
            const savedPuzzle = await context.puzzleRepository.findOne({
                where: { id: response.body.id },
                relations: ['country', 'clues'],
            });
            expect(savedPuzzle).toBeDefined();
            expect(savedPuzzle.country.code).toBe('QAT');
            expect(savedPuzzle.clues).toHaveLength(2);
        });

        it('should preserve clue order', async () => {
            // Arrange
            await createTestCountry(countryRepository);

            const clues = [
                { source: 'first', key: 'key1', value: 'value1' },
                { source: 'second', key: 'key2', value: 'value2' },
                { source: 'third', key: 'key3', value: 'value3' },
            ];

            // Act
            const result = await controller.create({ country_code: 'QAT', clues });

            // Assert
            expect(result.clues).toHaveLength(3);
            expect(result.clues[0].source).toBe('first');
            expect(result.clues[1].source).toBe('second');
            expect(result.clues[2].source).toBe('third');
        });

        it('should create multiple puzzles for the same country', async () => {
            // Arrange
            await createTestCountry(countryRepository);

            // Act
            const puzzle1 = await controller.create({
                country_code: 'QAT',
                clues: [{ source: 'test', key: 'key1', value: 'value1' }],
            });
            const puzzle2 = await controller.create({
                country_code: 'QAT',
                clues: [{ source: 'test', key: 'key2', value: 'value2' }],
            });

            // Assert
            expect(puzzle1.id).not.toBe(puzzle2.id);
            expect(puzzle1.country.code).toBe('QAT');
            expect(puzzle2.country.code).toBe('QAT');
            expect(puzzle1.clues[0].value).toBe('value1');
            expect(puzzle2.clues[0].value).toBe('value2');
        });

        it('should return 400 for non-existent country', async () => {
            const createPuzzleDto: CreatePuzzleDto = {
                country_code: 'XXX',
                clues: [
                    {
                        source: 'test',
                        key: 'test',
                        value: 'test',
                    },
                ],
            };

            await request(app.getHttpServer()).post('/puzzles').send(createPuzzleDto).expect(400);
        });

        it('should return 400 for empty clues array', async () => {
            // Arrange
            await createTestPuzzle(context, { skipClues: true });

            const createPuzzleDto: CreatePuzzleDto = {
                country_code: 'QAT',
                clues: [],
            };

            await request(app.getHttpServer()).post('/puzzles').send(createPuzzleDto).expect(400);
        });
    });

    describe('PUT /puzzles/:id', () => {
        it('should update an existing puzzle', async () => {
            // Arrange
            const puzzle = await createTestPuzzle(context);

            const updatePuzzleDto: CreatePuzzleDto = {
                country_code: 'QAT',
                clues: [
                    {
                        source: 'updated',
                        key: 'updated',
                        value: 'updated',
                    },
                ],
            };

            // Act
            const response = await request(app.getHttpServer())
                .put(`/puzzles/${puzzle.id}`)
                .send(updatePuzzleDto)
                .expect(200);

            // Assert
            expect(response.body).toMatchObject({
                id: puzzle.id,
                country: {
                    code: 'QAT',
                    name: 'Qatar',
                    flag: '🇶🇦',
                },
                clues: [
                    {
                        source: 'updated',
                        key: 'updated',
                        value: 'updated',
                    },
                ],
            });

            // Verify database state
            const updatedPuzzle = await context.puzzleRepository.findOne({
                where: { id: puzzle.id },
                relations: ['country', 'clues'],
            });
            expect(updatedPuzzle.clues).toHaveLength(1);
            expect(updatedPuzzle.clues[0].source).toBe('updated');
        });

        it('should return 404 for non-existent puzzle', async () => {
            const updatePuzzleDto: CreatePuzzleDto = {
                country_code: 'QAT',
                clues: [
                    {
                        source: 'test',
                        key: 'test',
                        value: 'test',
                    },
                ],
            };

            await request(app.getHttpServer()).put('/puzzles/999').send(updatePuzzleDto).expect(404);
        });
    });

    describe('DELETE /puzzles/:id', () => {
        it('should delete an existing puzzle', async () => {
            // Arrange
            const puzzle = await createTestPuzzle(context);

            // Act
            await request(app.getHttpServer()).delete(`/puzzles/${puzzle.id}`).expect(200);

            // Assert
            const deletedPuzzle = await context.puzzleRepository.findOne({
                where: { id: puzzle.id },
            });
            expect(deletedPuzzle).toBeNull();
        });

        it('should return 404 for non-existent puzzle', async () => {
            await request(app.getHttpServer()).delete('/puzzles/999').expect(404);
        });
    });

    describe('GET /puzzles', () => {
        it('should return paginated puzzles', async () => {
            // Arrange
            const country = await createTestCountry(countryRepository);
            const puzzles = await Promise.all([
                puzzleRepository.save({ country }),
                puzzleRepository.save({ country }),
                puzzleRepository.save({ country }),
            ]);

            // Act
            queryCounter.startCounting();
            const response = await request(app.getHttpServer()).get('/puzzles').expect(200);
            const queryCount = queryCounter.stopQueryCount();

            // Assert
            expect(response.body.puzzles).toHaveLength(3);
            expect(response.body.total).toBe(3);
            // The puzzles are returned in descending order by id
            const sortedPuzzles = [...puzzles].sort((a, b) => b.id - a.id);
            expect(response.body.puzzles[0].id).toBe(sortedPuzzles[0].id);
            expect(response.body.puzzles[1].id).toBe(sortedPuzzles[1].id);
            expect(response.body.puzzles[2].id).toBe(sortedPuzzles[2].id);

            // The paginated endpoint makes 3 queries:
            // 1. A query to get distinct puzzle IDs for pagination
            // 2. A query to get the full puzzle data with relations
            // 3. A query to get the total count for pagination metadata
            if (queryCount !== 3) {
                console.error('Executed queries:', queryCounter.getExecutedQueries());
            }
            expect(queryCount).toBe(3);
        });

        it('should filter puzzles by country code', async () => {
            // Arrange
            const country1 = await createTestCountry(countryRepository, {
                code: 'QAT',
                name: 'Qatar',
                flag: '🇶🇦',
            });
            const country2 = await createTestCountry(countryRepository, {
                code: 'USA',
                name: 'United States',
                flag: '🇺🇸',
            });
            await Promise.all([
                puzzleRepository.save({ country: country1 }),
                puzzleRepository.save({ country: country2 }),
            ]);

            // Act
            const response = await request(app.getHttpServer()).get('/puzzles?country_code=QAT').expect(200);

            // Assert
            expect(response.body.puzzles).toHaveLength(1);
            expect(response.body.total).toBe(1);
            expect(response.body.puzzles[0].country.code).toBe('QAT');
        });

        it('should handle pagination', async () => {
            // Arrange
            const country = await createTestCountry(countryRepository);
            const puzzles = await Promise.all([
                puzzleRepository.save({ country }),
                puzzleRepository.save({ country }),
                puzzleRepository.save({ country }),
            ]);

            // Act
            const response = await request(app.getHttpServer()).get('/puzzles?page=1&limit=2').expect(200);

            // Assert
            expect(response.body.puzzles).toHaveLength(2);
            expect(response.body.total).toBe(3);
            // The puzzles are returned in descending order by id
            const sortedPuzzles = [...puzzles].sort((a, b) => b.id - a.id);
            expect(response.body.puzzles[0].id).toBe(sortedPuzzles[0].id);
            expect(response.body.puzzles[1].id).toBe(sortedPuzzles[1].id);
        });
    });
});
