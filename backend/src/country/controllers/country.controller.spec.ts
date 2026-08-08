import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';

import { CountryModule } from '../country.module';
import { CountryResponseDto } from '../dto/country.response.dto';
import { CurrencyDto } from '../dto/currency.dto';
import { LanguageDto } from '../dto/language.dto';
import { Border } from '../entities/border.entity';
import { Country } from '../entities/country.entity';
import { Currency } from '../entities/currency.entity';
import { Language } from '../entities/language.entity';
import { CountryService } from '../services/country.service';
import { CountryController } from './country.controller';

describe('CountryController', () => {
    let app: INestApplication;
    let countryRepository: Repository<Country>;
    let currencyRepository: Repository<Currency>;
    let languageRepository: Repository<Language>;
    let dataSource: DataSource;
    let countryService: CountryService;

    const TEST_API_KEY = 'test-api-key';

    beforeEach(async () => {
        // noinspection ES6MissingAwait
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'better-sqlite3',
                    database: ':memory:',
                    dropSchema: true,
                    entities: [Country, Currency, Language, Border],
                    synchronize: true,
                    logging: false,
                }),
                CountryModule,
                TypeOrmModule.forFeature([Country, Currency, Language, Border]),
                ConfigModule.forRoot({
                    isGlobal: true,
                }),
            ],
            controllers: [CountryController],
            providers: [
                CountryService,
                {
                    provide: ConfigService,
                    // Mock ConfigService to return TEST_API_KEY for API_KEY requests and undefined for others
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
                    provide: Country,
                    useFactory: dataSource => dataSource.getRepository(Country),
                    inject: [getDataSourceToken()],
                },
                {
                    provide: Currency,
                    useFactory: dataSource => dataSource.getRepository(Currency),
                    inject: [getDataSourceToken()],
                },
                {
                    provide: Language,
                    useFactory: dataSource => dataSource.getRepository(Language),
                    inject: [getDataSourceToken()],
                },
                {
                    provide: Border,
                    useFactory: dataSource => dataSource.getRepository(Border),
                    inject: [getDataSourceToken()],
                },
            ],
        }).compile();

        app = module.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );
        await app.init();

        countryRepository = module.get<Repository<Country>>(getRepositoryToken(Country));
        currencyRepository = module.get<Repository<Currency>>(getRepositoryToken(Currency));
        languageRepository = module.get<Repository<Language>>(getRepositoryToken(Language));
        dataSource = module.get<DataSource>(getDataSourceToken());
        countryService = module.get<CountryService>(CountryService);
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('GET /countries', () => {
        it('should return all countries', async () => {
            // Arrange
            const countries = [
                { code: 'USA', name: 'United States', flag: '🇺🇸' },
                { code: 'CAN', name: 'Canada', flag: '🇨🇦' },
            ];
            await countryRepository.save(countries);

            // Act
            const response = await request(app.getHttpServer()).get('/countries').expect(200);

            // Assert
            expect(response.body).toHaveLength(2);
            expect(response.body).toContainEqual(expect.objectContaining({ code: 'USA' }));
            expect(response.body).toContainEqual(expect.objectContaining({ code: 'CAN' }));
        });

        it('should filter countries by name', async () => {
            // Arrange
            const countries = [
                { code: 'USA', name: 'United States', flag: '🇺🇸' },
                { code: 'CAN', name: 'Canada', flag: '🇨🇦' },
            ];
            await countryRepository.save(countries);

            // Act
            const response = await request(app.getHttpServer()).get('/countries?search=United').expect(200);

            // Assert
            expect(response.body).toHaveLength(1);
            expect(response.body[0].code).toBe('USA');
        });
    });

    describe('GET /countries/:code', () => {
        it('should return a country by code', async () => {
            // Arrange
            const country = { code: 'USA', name: 'United States', flag: '🇺🇸' };
            await countryRepository.save(country);

            // Act
            const response = await request(app.getHttpServer()).get('/countries/USA').expect(200);

            // Assert
            expect(response.body.code).toBe('USA');
            expect(response.body.name).toBe('United States');
            expect(response.body.flag).toBe('🇺🇸');
        });

        it('should return 404 for non-existent country', async () => {
            // Act & Assert
            await request(app.getHttpServer()).get('/countries/XXX').expect(404);
        });
    });

    describe('PUT /countries', () => {
        it('should create a new country', async () => {
            // Arrange
            const countryDto = {
                code: 'USA',
                name: 'United States',
                flag: '🇺🇸',
            };

            // Act
            const response = await request(app.getHttpServer())
                .put('/countries')
                .set('X-API-Key', TEST_API_KEY)
                .send(countryDto)
                .expect(200);

            // Assert
            expect(response.body.code).toBe('USA');
            expect(response.body.name).toBe('United States');
            expect(response.body.flag).toBe('🇺🇸');

            // Verify database state
            const savedCountry = await countryRepository.findOne({ where: { code: 'USA' } });
            expect(savedCountry).toBeDefined();
            expect(savedCountry.code).toBe('USA');
            expect(savedCountry.name).toBe('United States');
        });

        it('should update an existing country', async () => {
            // Arrange
            await countryRepository.save({ code: 'USA', name: 'United States', flag: '🇺🇸' });
            const countryDto = {
                code: 'USA',
                name: 'United States of America',
                flag: '🇺🇸',
            };

            // Act
            const response = await request(app.getHttpServer())
                .put('/countries')
                .set('X-API-Key', TEST_API_KEY)
                .send(countryDto)
                .expect(200);

            // Assert
            expect(response.body.code).toBe('USA');
            expect(response.body.name).toBe('United States of America');

            // Verify database state
            const updatedCountry = await countryRepository.findOne({ where: { code: 'USA' } });
            expect(updatedCountry.name).toBe('United States of America');
        });

        it('should handle currencies and languages', async () => {
            // Arrange
            await currencyRepository.save({ code: 'USD', name: 'US Dollar', symbol: '$' });
            await languageRepository.save({ code: 'eng', name: 'English' });
            const countryDto = {
                code: 'USA',
                name: 'United States',
                flag: '🇺🇸',
                currencyCodes: ['USD'],
                languageCodes: ['eng'],
            };

            // Act
            const response = await request(app.getHttpServer())
                .put('/countries')
                .set('X-API-Key', TEST_API_KEY)
                .send(countryDto)
                .expect(200);

            // Assert
            expect(response.body.code).toBe('USA');
            expect(response.body.currencies).toHaveLength(1);
            expect(response.body.currencies[0].code).toBe('USD');
            expect(response.body.languages).toHaveLength(1);
            expect(response.body.languages[0].code).toBe('eng');
        });

        it('should reject invalid currency codes', async () => {
            const countryDto = {
                code: 'USA',
                name: 'United States',
                flag: '🇺🇸',
                currencyCodes: ['XXX'],
            };

            const response = await request(app.getHttpServer())
                .put('/countries')
                .set('X-API-Key', TEST_API_KEY)
                .send(countryDto)
                .expect(400);

            expect(response.body.message).toContain('Invalid currency code(s): XXX');
        });

        it('should require API key', () => {
            const countryDto = {
                code: 'USA',
                name: 'United States',
                flag: '🇺🇸',
            };

            return request(app.getHttpServer()).put('/countries').send(countryDto).expect(401);
        });

        it('should reject invalid API key', () => {
            const countryDto = {
                code: 'USA',
                name: 'United States',
                flag: '🇺🇸',
            };

            return request(app.getHttpServer())
                .put('/countries')
                .set('X-API-Key', 'wrong-key')
                .send(countryDto)
                .expect(401);
        });
    });

    describe('DELETE /countries/:code', () => {
        it('should delete a country', async () => {
            // Arrange
            await countryRepository.save({ code: 'USA', name: 'United States', flag: '🇺🇸' });

            // Act
            await request(app.getHttpServer()).delete('/countries/USA').set('X-API-Key', TEST_API_KEY).expect(200);

            // Assert
            const deletedCountry = await countryRepository.findOne({ where: { code: 'USA' } });
            expect(deletedCountry).toBeNull();
        });

        it('should return 404 for non-existent country', async () => {
            // Act & Assert
            await request(app.getHttpServer()).delete('/countries/XXX').set('X-API-Key', TEST_API_KEY).expect(404);
        });

        it('should return 400 when country is in use by puzzles', async () => {
            // Arrange
            await countryRepository.save({ code: 'USA', name: 'United States', flag: '🇺🇸' });

            // Create a puzzle that references this country
            await dataSource.query(`
                CREATE TABLE IF NOT EXISTS puzzle
                (
                    id
                    INTEGER
                    PRIMARY
                    KEY
                    AUTOINCREMENT,
                    country_code
                    VARCHAR
                (
                    3
                ) NOT NULL,
                    FOREIGN KEY
                (
                    country_code
                ) REFERENCES country
                (
                    code
                )
                    )
            `);
            await dataSource.query(`INSERT INTO puzzle (country_code)
                                    VALUES ('USA')`);

            // Act & Assert
            const response = await request(app.getHttpServer())
                .delete('/countries/USA')
                .set('X-API-Key', TEST_API_KEY)
                .expect(400);
            expect(response.body.message).toContain(
                'Cannot delete country USA because it is still being used in puzzles',
            );
        });

        it('should require API key', () => {
            return request(app.getHttpServer()).delete('/countries/USA').expect(401);
        });

        it('should reject invalid API key', () => {
            return request(app.getHttpServer()).delete('/countries/USA').set('X-API-Key', 'wrong-key').expect(401);
        });
    });

    describe('PUT /countries/bulk', () => {
        it('should bulk update multiple countries (good-weather)', async () => {
            // Arrange
            // Create currencies and languages
            await currencyRepository.save({ code: 'USD', name: 'US Dollar', symbol: '$' });
            await currencyRepository.save({ code: 'CAD', name: 'Canadian Dollar', symbol: '$' });
            await languageRepository.save({ code: 'eng', name: 'English' });
            await languageRepository.save({ code: 'fra', name: 'French' });

            // Create countries
            await countryRepository.save([
                { code: 'USA', name: 'United States', flag: '🇺🇸', population: 1000 },
                { code: 'CAN', name: 'Canada', flag: '🇨🇦', population: 1000 },
            ]);

            // Prepare bulk update payload
            const updates = {
                USA: {
                    name: 'United States of America',
                    flag: '🇺🇸',
                    population: 333000000,
                    area: 9834000,
                    populationDensity: 33.9,
                    currencies: ['USD'],
                    languages: ['eng'],
                    borders: ['CAN'],
                },
                CAN: {
                    name: 'Canada',
                    flag: '🇨🇦',
                    population: 38000000,
                    area: 9985000,
                    populationDensity: 3.8,
                    currencies: ['CAD'],
                    languages: ['eng', 'fra'],
                    borders: ['USA'],
                },
            };

            // Act
            const response = await request(app.getHttpServer())
                .put('/countries/bulk')
                .set('X-API-Key', TEST_API_KEY)
                .send(updates)
                .expect(res => {
                    if (res.status !== 200) {
                        throw new Error(
                            `Expected status 200 but got ${res.status}. Response: ${JSON.stringify(res.body)}`,
                        );
                    }
                });

            // Assert
            expect(response.body).toHaveLength(2);
            const usa = response.body.find((c: CountryResponseDto) => c.code === 'USA');
            const can = response.body.find((c: CountryResponseDto) => c.code === 'CAN');
            expect(usa).toMatchObject({
                code: 'USA',
                name: 'United States of America',
                flag: '🇺🇸',
                population: 333000000,
                area: 9834000,
                populationDensity: 33.9,
                borders: ['CAN'],
            });
            expect(usa.currencies).toHaveLength(1);
            expect(usa.currencies[0].code).toBe('USD');
            expect(usa.languages).toHaveLength(1);
            expect(usa.languages[0].code).toBe('eng');
            expect(can).toMatchObject({
                code: 'CAN',
                name: 'Canada',
                flag: '🇨🇦',
                population: 38000000,
                area: 9985000,
                populationDensity: 3.8,
                borders: ['USA'],
            });
            expect(can.currencies).toHaveLength(1);
            expect(can.currencies[0].code).toBe('CAD');
            expect(can.languages).toHaveLength(2);
            expect(can.languages.map((l: LanguageDto) => l.code).sort()).toEqual(['eng', 'fra']);

            // Verify database state
            const updatedUSA = await countryService.findOne('USA');
            expect(updatedUSA.name).toBe('United States of America');
            expect(updatedUSA.population).toBe(333000000);
            expect(updatedUSA.currencies.map((c: CurrencyDto) => c.code)).toEqual(['USD']);
            expect(updatedUSA.languages.map((l: LanguageDto) => l.code)).toEqual(['eng']);
            expect(updatedUSA.borders).toEqual(['CAN']);

            const updatedCAN = await countryService.findOne('CAN');
            expect(updatedCAN.population).toBe(38000000);
            expect(updatedCAN.currencies.map((c: CurrencyDto) => c.code)).toEqual(['CAD']);
            expect(updatedCAN.languages.map((l: LanguageDto) => l.code).sort()).toEqual(['eng', 'fra']);
            expect(updatedCAN.borders).toEqual(['USA']);
        });

        it('should return 401 if API key is missing', async () => {
            const updates = { USA: { name: 'Test' } };
            await request(app.getHttpServer()).put('/countries/bulk').send(updates).expect(401);
        });

        it('should return 401 if API key is invalid', async () => {
            const updates = { USA: { name: 'Test' } };
            await request(app.getHttpServer())
                .put('/countries/bulk')
                .set('X-API-Key', 'wrong-key')
                .send(updates)
                .expect(401);
        });

        it('should return 400 for invalid country code', async () => {
            await currencyRepository.save({ code: 'USD', name: 'US Dollar', symbol: '$' });
            await languageRepository.save({ code: 'eng', name: 'English' });
            await countryRepository.save({ code: 'USA', name: 'United States', flag: '🇺🇸' });
            const updates = {
                USA: { name: 'Valid' },
                XXX: { name: 'Invalid' },
            };
            const response = await request(app.getHttpServer())
                .put('/countries/bulk')
                .set('X-API-Key', TEST_API_KEY)
                .send(updates)
                .expect(400);
            expect(response.body.message).toContain('Invalid country code(s): XXX');
        });

        it('should return 400 for invalid currency code', async () => {
            await currencyRepository.save({ code: 'USD', name: 'US Dollar', symbol: '$' });
            await languageRepository.save({ code: 'eng', name: 'English' });
            await countryRepository.save({ code: 'USA', name: 'United States', flag: '🇺🇸' });
            const updates = {
                USA: { currencies: ['USD', 'FAKE'] },
            };
            const response = await request(app.getHttpServer())
                .put('/countries/bulk')
                .set('X-API-Key', TEST_API_KEY)
                .send(updates)
                .expect(400);
            expect(response.body.message).toContain('Invalid currency code(s): FAKE');
        });

        it('should return 400 for invalid language code', async () => {
            await currencyRepository.save({ code: 'USD', name: 'US Dollar', symbol: '$' });
            await languageRepository.save({ code: 'eng', name: 'English' });
            await countryRepository.save({ code: 'USA', name: 'United States', flag: '🇺🇸' });
            const updates = {
                USA: { languages: ['eng', 'zzz'] },
            };
            const response = await request(app.getHttpServer())
                .put('/countries/bulk')
                .set('X-API-Key', TEST_API_KEY)
                .send(updates)
                .expect(400);
            expect(response.body.message).toContain('Invalid language code(s): zzz');
        });

        it('should return 400 for empty currencies array', async () => {
            await currencyRepository.save({ code: 'USD', name: 'US Dollar', symbol: '$' });
            await languageRepository.save({ code: 'eng', name: 'English' });
            await countryRepository.save({ code: 'USA', name: 'United States', flag: '🇺🇸' });
            const updates = {
                USA: { currencies: [] },
            };
            const response = await request(app.getHttpServer())
                .put('/countries/bulk')
                .set('X-API-Key', TEST_API_KEY)
                .send(updates)
                .expect(400);
            expect(JSON.stringify(response.body.message)).toContain('should not be empty');
        });

        it('should return 400 for empty languages array', async () => {
            await currencyRepository.save({ code: 'USD', name: 'US Dollar', symbol: '$' });
            await languageRepository.save({ code: 'eng', name: 'English' });
            await countryRepository.save({ code: 'USA', name: 'United States', flag: '🇺🇸' });
            const updates = {
                USA: { languages: [] },
            };
            const response = await request(app.getHttpServer())
                .put('/countries/bulk')
                .set('X-API-Key', TEST_API_KEY)
                .send(updates)
                .expect(400);
            expect(JSON.stringify(response.body.message)).toContain('should not be empty');
        });

        it('should return 400 for invalid field in update object', async () => {
            await currencyRepository.save({ code: 'USD', name: 'US Dollar', symbol: '$' });
            await languageRepository.save({ code: 'eng', name: 'English' });
            await countryRepository.save({ code: 'USA', name: 'United States', flag: '🇺🇸' });
            const updates = {
                USA: { notAField: 123 },
            };
            const response = await request(app.getHttpServer())
                .put('/countries/bulk')
                .set('X-API-Key', TEST_API_KEY)
                .send(updates)
                .expect(400);
            expect(JSON.stringify(response.body.message)).toContain('should not exist');
        });

        it('should return 400 for invalid type for population', async () => {
            await currencyRepository.save({ code: 'USD', name: 'US Dollar', symbol: '$' });
            await languageRepository.save({ code: 'eng', name: 'English' });
            await countryRepository.save({ code: 'USA', name: 'United States', flag: '🇺🇸' });
            const updates = {
                USA: { population: 'not-a-number' },
            };
            const response = await request(app.getHttpServer())
                .put('/countries/bulk')
                .set('X-API-Key', TEST_API_KEY)
                .send(updates)
                .expect(400);
            expect(JSON.stringify(response.body.message)).toContain('must be a number');
        });

        it('should update borders correctly when changing them in bulk', async () => {
            // Arrange
            await countryRepository.save([
                { code: 'USA', name: 'United States', flag: '🇺🇸', population: 1000 },
                { code: 'CAN', name: 'Canada', flag: '🇨🇦', population: 1000 },
                { code: 'MEX', name: 'Mexico', flag: '🇲🇽', population: 1000 },
            ]);

            // Set initial borders: USA borders CAN
            await request(app.getHttpServer())
                .put('/countries/bulk')
                .set('X-API-Key', TEST_API_KEY)
                .send({ USA: { borders: ['CAN'] }, CAN: { borders: ['USA'] } })
                .expect(200);

            // Verify initial state
            let usa = await countryService.findOne('USA');
            let can = await countryService.findOne('CAN');
            let mex = await countryService.findOne('MEX');
            expect(usa.borders).toEqual(['CAN']);
            expect(can.borders).toEqual(['USA']);
            expect(mex.borders).toEqual([]);

            // Bulk update: USA borders only MEX
            const updates = {
                USA: { borders: ['MEX'] },
                MEX: { borders: ['USA'] },
            };
            const response = await request(app.getHttpServer())
                .put('/countries/bulk')
                .set('X-API-Key', TEST_API_KEY)
                .send(updates)
                .expect(200);

            // Assert response
            const updatedUSA = response.body.find((c: CountryResponseDto) => c.code === 'USA');
            const updatedCAN = response.body.find((c: CountryResponseDto) => c.code === 'CAN');
            const updatedMEX = response.body.find((c: CountryResponseDto) => c.code === 'MEX');
            expect(updatedUSA.borders).toEqual(['MEX']);
            expect(updatedMEX.borders).toEqual(['USA']);
            expect(updatedCAN).toBeUndefined();

            // Verify database state
            usa = await countryService.findOne('USA');
            can = await countryService.findOne('CAN');
            mex = await countryService.findOne('MEX');
            expect(usa.borders).toEqual(['MEX']);
            expect(mex.borders).toEqual(['USA']);
            expect(can.borders).toEqual([]);
        });
    });
});
