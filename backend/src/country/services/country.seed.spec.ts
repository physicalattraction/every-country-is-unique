import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import * as fs from 'fs';
import { DataSource, Repository } from 'typeorm';

import { Border } from '../entities/border.entity';
import { Country } from '../entities/country.entity';
import { Currency } from '../entities/currency.entity';
import { Language } from '../entities/language.entity';
import { CountrySeedService } from './country.seed';

describe('CountrySeedService', () => {
    let service: CountrySeedService;
    let countryRepository: Repository<Country>;
    let currencyRepository: Repository<Currency>;
    let languageRepository: Repository<Language>;
    let dataSource: DataSource;
    let readFileSyncSpy: jest.SpyInstance;

    beforeAll(async () => {
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
                TypeOrmModule.forFeature([Country, Currency, Language, Border]),
            ],
            providers: [CountrySeedService],
        }).compile();

        service = module.get<CountrySeedService>(CountrySeedService);
        countryRepository = module.get<Repository<Country>>(getRepositoryToken(Country));
        currencyRepository = module.get<Repository<Currency>>(getRepositoryToken(Currency));
        languageRepository = module.get<Repository<Language>>(getRepositoryToken(Language));
        dataSource = module.get<DataSource>(getDataSourceToken());
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    beforeEach(async () => {
        await dataSource.query('DELETE FROM country_currencies');
        await dataSource.query('DELETE FROM country_languages');
        await countryRepository.clear();
        await currencyRepository.clear();
        await languageRepository.clear();

        readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(
            JSON.stringify([
                {
                    cca3: 'USA',
                    name: { common: 'United States' },
                    currencies: {
                        USD: { name: 'United States dollar', symbol: '$' },
                        USN: { name: 'United States dollar (next day)' },
                    },
                    languages: {
                        eng: 'English',
                        spa: 'Spanish',
                    },
                },
                {
                    cca3: 'CAN',
                    name: { common: 'Canada' },
                    currencies: {
                        CAD: { name: 'Canadian dollar', symbol: '$' },
                    },
                    languages: {
                        eng: 'English',
                        fra: 'French',
                    },
                },
                {
                    cca3: 'ATA',
                    name: { common: 'Antarctica' },
                },
            ]),
        );
    });

    afterEach(() => {
        readFileSyncSpy.mockRestore();
    });

    it('should seed countries, currencies, and languages from rest country data', async () => {
        await service.seed();

        const usa = await countryRepository.findOne({
            where: { code: 'USA' },
            relations: ['currencies', 'languages'],
        });
        const canada = await countryRepository.findOne({
            where: { code: 'CAN' },
            relations: ['currencies', 'languages'],
        });
        const afghanistan = await countryRepository.findOne({
            where: { code: 'AFG' },
            relations: ['currencies', 'languages'],
        });

        expect(readFileSyncSpy).toHaveBeenCalled();
        expect(usa).toMatchObject({ code: 'USA', name: 'United States', flag: '🇺🇸' });
        expect(usa?.currencies.map(currency => currency.code).sort()).toEqual(['USD', 'USN']);
        expect(usa?.languages.map(language => language.code).sort()).toEqual(['eng', 'spa']);
        expect(canada?.currencies.map(currency => currency.code)).toEqual(['CAD']);
        expect(afghanistan).toMatchObject({ code: 'AFG', name: 'Afghanistan', flag: '🇦🇫' });
        expect(afghanistan?.currencies).toEqual([]);
        expect(afghanistan?.languages).toEqual([]);

        const usn = await currencyRepository.findOneBy({ code: 'USN' });
        expect(usn?.symbol).toBe('');
    });

    it('should update existing country name and flag on reseed', async () => {
        await countryRepository.save({
            code: 'USA',
            name: 'Old Name',
            flag: '❓',
        });

        await service.seed();

        const usa = await countryRepository.findOneBy({ code: 'USA' });
        expect(usa).toMatchObject({
            code: 'USA',
            name: 'United States',
            flag: '🇺🇸',
        });
    });
});
