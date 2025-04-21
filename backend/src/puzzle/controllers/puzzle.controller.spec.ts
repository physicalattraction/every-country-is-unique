import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
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
    let clueRepository: Repository<Clue>;
    let countryRepository: Repository<Country>;
    let dataSource: DataSource;
    let queryCounter: QueryCounter;

    const TEST_API_KEY = 'test-api-key';

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
                PuzzleModule,
                TypeOrmModule.forFeature([Puzzle, Clue, Country]),
                ConfigModule.forRoot({
                    isGlobal: true,
                }),
            ],
            controllers: [PuzzleController],
            providers: [
                PuzzleService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            if (key === 'API_KEY') {
                                return TEST_API_KEY;
                            }
                            return undefined;
                        }),
                    },
                },
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
        puzzleRepository = module.get<Repository<Puzzle>>(getRepositoryToken(Puzzle));
        clueRepository = module.get<Repository<Clue>>(getRepositoryToken(Clue));
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
        if (dataSource.isInitialized) {
            await clueRepository.delete({});
            await puzzleRepository.delete({});
        }
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('GET /puzzles', () => {
        it('should return paginated puzzles', async () => {
            // Arrange
            const country = await createTestCountry(countryRepository);
            const puzzles = await Promise.all([
                puzzleRepository.save({ country, deduplicationKey: 'test-key-1' }),
                puzzleRepository.save({ country, deduplicationKey: 'test-key-2' }),
                puzzleRepository.save({ country, deduplicationKey: 'test-key-3' }),
            ]);

            // Act
            queryCounter.startCounting();
            const response = await request(app.getHttpServer()).get('/puzzles').expect(200);

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
            expect(queryCounter.verifyQueryCount(3)).toBe(true);
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
                puzzleRepository.save({ country: country1, deduplicationKey: 'test-key-1' }),
                puzzleRepository.save({ country: country2, deduplicationKey: 'test-key-2' }),
            ]);

            // Act
            const response = await request(app.getHttpServer()).get('/puzzles?countryCode=QAT').expect(200);

            // Assert
            expect(response.body.puzzles).toHaveLength(1);
            expect(response.body.total).toBe(1);
            expect(response.body.puzzles[0].country.code).toBe('QAT');
        });

        it('should handle pagination', async () => {
            // Arrange
            const country = await createTestCountry(countryRepository);
            const puzzles = await Promise.all([
                puzzleRepository.save({ country, deduplicationKey: 'test-key-1' }),
                puzzleRepository.save({ country, deduplicationKey: 'test-key-2' }),
                puzzleRepository.save({ country, deduplicationKey: 'test-key-3' }),
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

    describe('GET /puzzles/:id', () => {
        it('should return a puzzle by id', async () => {
            const puzzle = await createTestPuzzle(context);
            const response = await request(app.getHttpServer())
                .get(`/puzzles/${puzzle.id}`)
                .expect(200);

            expect(response.body.id).toBe(puzzle.id);
            expect(response.body.country.code).toBe('QAT');
            expect(response.body.clues).toHaveLength(2);
        });

        it('should return 404 for non-existent puzzle', () => {
            return request(app.getHttpServer())
                .get('/puzzles/999')
                .expect(404);
        });

        it('should return 400 for invalid puzzle id', () => {
            return request(app.getHttpServer())
                .get('/puzzles/invalid')
                .expect(400);
        });
    });

    describe('POST /puzzles', () => {
        const createPuzzleDto: CreatePuzzleDto = {
            countryCode: 'QAT',
            clues: [
                {
                    source: 'test',
                    key: 'test',
                    value: 'test',
                },
            ],
            alternativeCountries: [['OMN', 'UAE']],
            deduplicationKey: 'test-hash'
        };

        it('should create a new puzzle', async () => {
            // Arrange
            await createTestCountry(countryRepository);

            // Act
            const response = await request(app.getHttpServer())
                .post('/puzzles')
                .set('X-API-Key', TEST_API_KEY)
                .send(createPuzzleDto)
                .expect(201);

            // Assert
            expect(response.body.country.code).toBe('QAT');
            expect(response.body.clues).toHaveLength(1);
            expect(response.body.clues[0].source).toBe('test');
            expect(response.body.alternativeCountries).toEqual([['OMN', 'UAE']]);
        });

        it('should return 400 for non-existent country', async () => {
            return request(app.getHttpServer())
                .post('/puzzles')
                .set('X-API-Key', TEST_API_KEY)
                .send({ ...createPuzzleDto, countryCode: 'XXX' })
                .expect(400);
        });

        it('should return 400 for invalid country codes in alternativeCountries', async () => {
            await createTestCountry(countryRepository);
            return request(app.getHttpServer())
                .post('/puzzles')
                .set('X-API-Key', TEST_API_KEY)
                .send({
                    ...createPuzzleDto,
                    alternativeCountries: [['INVALID', 'UAE']]
                })
                .expect(400);
        });

        it('should return 400 for empty clues array', async () => {
            await createTestCountry(countryRepository);
            return request(app.getHttpServer())
                .post('/puzzles')
                .set('X-API-Key', TEST_API_KEY)
                .send({ ...createPuzzleDto, clues: [] })
                .expect(400);
        });

        it('should require API key', () => {
            return request(app.getHttpServer())
                .post('/puzzles')
                .send(createPuzzleDto)
                .expect(401);
        });

        it('should reject invalid API key', () => {
            return request(app.getHttpServer())
                .post('/puzzles')
                .set('X-API-Key', 'wrong-key')
                .send(createPuzzleDto)
                .expect(401);
        });

        it('should not create duplicate puzzles with the same deduplicationKey', async () => {
            // Arrange
            await createTestCountry(countryRepository);
            const duplicateKey = 'duplicate-key';
            const createPuzzleDtoWithKey = {
                ...createPuzzleDto,
                deduplicationKey: duplicateKey
            };

            // Act - Create puzzle twice with same key
            await request(app.getHttpServer())
                .post('/puzzles')
                .set('X-API-Key', TEST_API_KEY)
                .send(createPuzzleDtoWithKey)
                .expect(201);

            await request(app.getHttpServer())
                .post('/puzzles')
                .set('X-API-Key', TEST_API_KEY)
                .send(createPuzzleDtoWithKey)
                .expect(201);

            // Assert - Verify only one puzzle exists with this key
            const puzzles = await puzzleRepository.find({ where: { deduplicationKey: duplicateKey } });
            expect(puzzles).toHaveLength(1);
        });
    });

    describe('PUT /puzzles/:id', () => {
        const createPuzzleDto: CreatePuzzleDto = {
            countryCode: 'QAT',
            clues: [
                {
                    source: 'test',
                    key: 'test',
                    value: 'test',
                },
            ],
            alternativeCountries: [['OMN', 'UAE']],
            deduplicationKey: 'test-hash'
        };

        it('should update an existing puzzle', async () => {
            // Arrange
            await createTestCountry(countryRepository);
            const puzzle = await createTestPuzzle(context);

            // Act
            const response = await request(app.getHttpServer())
                .put(`/puzzles/${puzzle.id}`)
                .set('X-API-Key', TEST_API_KEY)
                .send({
                    ...createPuzzleDto,
                    clues: [{ source: 'updated', key: 'test', value: 'test' }]
                })
                .expect(200);

            // Assert
            expect(response.body.id).toBe(puzzle.id);
            expect(response.body.clues).toHaveLength(1);
            expect(response.body.clues[0].source).toBe('updated');
            expect(response.body.alternativeCountries).toEqual([['OMN', 'UAE']]);
        });

        it('should return 400 for non-existent country', async () => {
            // Arrange
            const puzzle = await createTestPuzzle(context);

            return request(app.getHttpServer())
                .put(`/puzzles/${puzzle.id}`)
                .set('X-API-Key', TEST_API_KEY)
                .send({ ...createPuzzleDto, countryCode: 'XXX' })
                .expect(400);
        });

        it('should return 400 for invalid country codes in alternativeCountries', async () => {
            // Arrange
            await createTestCountry(countryRepository);
            const puzzle = await createTestPuzzle(context);

            return request(app.getHttpServer())
                .put(`/puzzles/${puzzle.id}`)
                .set('X-API-Key', TEST_API_KEY)
                .send({
                    ...createPuzzleDto,
                    alternativeCountries: [['INVALID', 'UAE']]
                })
                .expect(400);
        });

        it('should return 400 for empty clues array', async () => {
            // Arrange
            await createTestCountry(countryRepository);
            const puzzle = await createTestPuzzle(context);

            return request(app.getHttpServer())
                .put(`/puzzles/${puzzle.id}`)
                .set('X-API-Key', TEST_API_KEY)
                .send({ ...createPuzzleDto, clues: [] })
                .expect(400);
        });

        it('should require API key', async () => {
            // Arrange
            const puzzle = await createTestPuzzle(context);

            return request(app.getHttpServer())
                .put(`/puzzles/${puzzle.id}`)
                .send(createPuzzleDto)
                .expect(401);
        });

        it('should reject invalid API key', async () => {
            // Arrange
            const puzzle = await createTestPuzzle(context);

            return request(app.getHttpServer())
                .put(`/puzzles/${puzzle.id}`)
                .set('X-API-Key', 'wrong-key')
                .send(createPuzzleDto)
                .expect(401);
        });
    });

    describe('DELETE /puzzles/:id', () => {
        it('should delete a puzzle', async () => {
            // Arrange
            const puzzle = await createTestPuzzle(context);

            // Act
            await request(app.getHttpServer())
                .delete(`/puzzles/${puzzle.id}`)
                .set('X-API-Key', TEST_API_KEY)
                .expect(200);

            // Assert
            const deletedPuzzle = await puzzleRepository.findOne({ where: { id: puzzle.id } });
            expect(deletedPuzzle).toBeNull();
        });

        it('should return 404 for non-existent puzzle', async () => {
            return request(app.getHttpServer())
                .delete('/puzzles/999')
                .set('X-API-Key', TEST_API_KEY)
                .expect(404);
        });

        it('should require API key', async () => {
            const puzzle = await createTestPuzzle(context);
            return request(app.getHttpServer())
                .delete(`/puzzles/${puzzle.id}`)
                .expect(401);
        });

        it('should reject invalid API key', async () => {
            const puzzle = await createTestPuzzle(context);
            return request(app.getHttpServer())
                .delete(`/puzzles/${puzzle.id}`)
                .set('X-API-Key', 'wrong-key')
                .expect(401);
        });
    });
});
