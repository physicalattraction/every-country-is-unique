import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';

import { Country } from '../../country/entities/country.entity';
import { Currency } from '../../country/entities/currency.entity';
import { Language } from '../../country/entities/language.entity';
import { CreatePuzzleDto } from '../dto/create-puzzle.dto';
import { Clue } from '../entities/clue.entity';
import { Puzzle } from '../entities/puzzle.entity';
import { PuzzleModule } from '../puzzle.module';
import { PuzzleService } from '../services/puzzle.service';
import { TestRepositoryContext, createTestContext, createTestCountry, createTestPuzzle } from '../test/puzzle.test-helpers';
import { PuzzleController } from './puzzle.controller';

describe('PuzzleController', () => {
    let app: INestApplication;
    let context: TestRepositoryContext;
    let controller: PuzzleController;
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
        clueRepository = module.get<Repository<Clue>>(Clue);
        countryRepository = module.get<Repository<Country>>(Country);
    });

    afterEach(async () => {
        await app.close();
    });

    describe('GET /puzzles/:id', () => {
        it('should return a puzzle with its country and clues', async () => {
            // Arrange
            const puzzle = await createTestPuzzle(context);

            // Act
            const response = await request(app.getHttpServer())
                .get(`/puzzles/${puzzle.id}`)
                .expect(200);

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
            await request(app.getHttpServer())
                .get('/puzzles/999')
                .expect(404);
        });
    });

    describe('POST /puzzles', () => {
        it('should create a new puzzle with clues', async () => {
            // Arrange
            await createTestPuzzle(context, { skipClues: true });

            const createPuzzleDto: CreatePuzzleDto = {
                countryCode: 'QAT',
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
            const response = await request(app.getHttpServer())
                .post('/puzzles')
                .send(createPuzzleDto)
                .expect(201);

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
            const result = await controller.create({ countryCode: 'QAT', clues });

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
            const puzzle1 = await controller.create({ countryCode: 'QAT', clues: [{ source: 'test', key: 'key1', value: 'value1' }] });
            const puzzle2 = await controller.create({ countryCode: 'QAT', clues: [{ source: 'test', key: 'key2', value: 'value2' }] });

            // Assert
            expect(puzzle1.id).not.toBe(puzzle2.id);
            expect(puzzle1.country.code).toBe('QAT');
            expect(puzzle2.country.code).toBe('QAT');
            expect(puzzle1.clues[0].value).toBe('value1');
            expect(puzzle2.clues[0].value).toBe('value2');
        });

        it('should return 400 for non-existent country', async () => {
            const createPuzzleDto: CreatePuzzleDto = {
                countryCode: 'XXX',
                clues: [
                    {
                        source: 'test',
                        key: 'test',
                        value: 'test',
                    },
                ],
            };

            await request(app.getHttpServer())
                .post('/puzzles')
                .send(createPuzzleDto)
                .expect(400);
        });

        it('should return 400 for empty clues array', async () => {
            // Arrange
            await createTestPuzzle(context, { skipClues: true });

            const createPuzzleDto: CreatePuzzleDto = {
                countryCode: 'QAT',
                clues: [],
            };

            await request(app.getHttpServer())
                .post('/puzzles')
                .send(createPuzzleDto)
                .expect(400);
        });
    });

    describe('PUT /puzzles/:id', () => {
        it('should update an existing puzzle', async () => {
            // Arrange
            const puzzle = await createTestPuzzle(context);

            const updatePuzzleDto: CreatePuzzleDto = {
                countryCode: 'QAT',
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
                countryCode: 'QAT',
                clues: [
                    {
                        source: 'test',
                        key: 'test',
                        value: 'test',
                    },
                ],
            };

            await request(app.getHttpServer())
                .put('/puzzles/999')
                .send(updatePuzzleDto)
                .expect(404);
        });
    });

    describe('DELETE /puzzles/:id', () => {
        it('should delete an existing puzzle', async () => {
            // Arrange
            const puzzle = await createTestPuzzle(context);

            // Act
            await request(app.getHttpServer())
                .delete(`/puzzles/${puzzle.id}`)
                .expect(200);

            // Assert
            const deletedPuzzle = await context.puzzleRepository.findOne({
                where: { id: puzzle.id },
            });
            expect(deletedPuzzle).toBeNull();
        });

        it('should return 404 for non-existent puzzle', async () => {
            await request(app.getHttpServer())
                .delete('/puzzles/999')
                .expect(404);
        });
    });

}); 