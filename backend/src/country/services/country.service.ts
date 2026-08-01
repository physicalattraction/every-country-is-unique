import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindManyOptions, FindOptionsWhere, In, Repository } from 'typeorm';

import { CountryBulkUpdateDto } from '../dto/country.bulk-update.dto';
import { CountryQueryDto } from '../dto/country.query.dto';
import { CountryQuickResponseDto } from '../dto/country.quick-response.dto';
import { CountryResponseDto } from '../dto/country.response.dto';
import { CountryUpsertDto } from '../dto/country.upsert.dto';
import { Border } from '../entities/border.entity';
import { Country } from '../entities/country.entity';
import { Currency } from '../entities/currency.entity';
import { Language } from '../entities/language.entity';

/** Shared field patch applied by both upsert and bulk update */
type CountryFieldUpdate = {
    name?: string;
    flag?: string;
    population?: number;
    area?: number;
    populationDensity?: number;
    isLandlocked?: boolean;
    currencies?: string[];
    languages?: string[];
    borders?: string[];
};

@Injectable()
export class CountryService {
    private readonly logger = new Logger(CountryService.name);

    constructor(
        @InjectRepository(Country)
        private countryRepository: Repository<Country>,
        @InjectRepository(Currency)
        private currencyRepository: Repository<Currency>,
        @InjectRepository(Language)
        private languageRepository: Repository<Language>,
        @InjectRepository(Border)
        private borderRepository: Repository<Border>,
    ) {
        // Nothing to do here
    }

    async findAll(query: CountryQueryDto): Promise<CountryQuickResponseDto[]> {
        const { search } = query;

        const queryBuilder = this.countryRepository.createQueryBuilder('country');

        if (search) {
            queryBuilder.where('LOWER(country.name) LIKE LOWER(:search)', { search: `%${search}%` });
        }

        const countries = await queryBuilder.orderBy('country.name', 'ASC').getMany();

        return countries.map(country => ({
            code: country.code,
            name: country.name,
            flag: country.flag,
        }));
    }

    async findOne(code: string): Promise<CountryResponseDto> {
        const country = await this.countryRepository.findOne({
            where: { code },
            relations: ['currencies', 'languages'],
        });

        if (!country) {
            throw new NotFoundException(`Country with code ${code} not found`);
        }

        const borders = await this.borderRepository.find({
            where: [{ country1_code: code }, { country2_code: code }],
        });

        return this.toCountryResponse(country, borders);
    }

    async upsert(dto: CountryUpsertDto): Promise<CountryResponseDto> {
        const update: CountryFieldUpdate = {
            name: dto.name,
            flag: dto.flag,
            population: dto.population,
            area: dto.area,
            populationDensity: dto.populationDensity,
            isLandlocked: dto.isLandlocked,
            currencies: dto.currencyCodes,
            languages: dto.languageCodes,
            borders: dto.borders,
        };

        const [result] = await this.applyCountryUpdates({ [dto.code]: update }, { createMissing: true });
        return result;
    }

    async delete(code: string): Promise<void> {
        try {
            const result = await this.countryRepository.delete(code);
            if (result.affected === 0) {
                throw new NotFoundException(`Country with code ${code} not found`);
            }
        } catch (error) {
            // Check for foreign key constraint violation
            if (
                error.code === '23503' || // PostgreSQL foreign key violation code
                error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY'
            ) {
                // SQLite foreign key violation code
                throw new BadRequestException(
                    `Cannot delete country ${code} because it is still being used in puzzles`,
                );
            }

            // Only log unexpected errors
            if (!(error instanceof NotFoundException) && !(error instanceof BadRequestException)) {
                this.logger.error(`Error deleting country ${code}:`, error);
            }

            // Re-throw other errors
            throw error;
        }
    }

    async bulkUpdateCountries(updates: CountryBulkUpdateDto): Promise<CountryResponseDto[]> {
        return this.applyCountryUpdates(updates);
    }

    private async applyCountryUpdates(
        updates: Record<string, CountryFieldUpdate>,
        options: { createMissing?: boolean } = {},
    ): Promise<CountryResponseDto[]> {
        const countryCodes = Object.keys(updates);
        if (countryCodes.length === 0) {
            return [];
        }

        const [countryMap, currencyMap, languageMap] = await Promise.all([
            this.loadCountryMap(updates, options.createMissing === true),
            this.getCodeMap(
                this.currencyRepository,
                this.collectCodes(updates, update => update.currencies),
                'currency',
            ),
            this.getCodeMap(
                this.languageRepository,
                this.collectCodes(updates, update => update.languages),
                'language',
            ),
        ]);

        await this.countryRepository.manager.transaction(async transactionalEntityManager => {
            await this.updateBorders(updates, transactionalEntityManager);

            const updatedCountries: Country[] = [];
            for (const code of countryCodes) {
                const country = this.requireMapped(countryMap, code, 'country');
                this.applyFieldUpdate(country, updates[code], currencyMap, languageMap);
                updatedCountries.push(country);
            }

            await transactionalEntityManager.save(Country, updatedCountries);
        });

        return this.loadCountryResponses(countryCodes);
    }

    private applyFieldUpdate(
        country: Country,
        update: CountryFieldUpdate,
        currencyMap: Map<string, Currency>,
        languageMap: Map<string, Language>,
    ): void {
        if (update.name !== undefined) country.name = update.name;
        if (update.flag !== undefined) country.flag = update.flag;
        if (update.population !== undefined) country.population = update.population;
        if (update.area !== undefined) country.area = update.area;
        if (update.populationDensity !== undefined) country.populationDensity = update.populationDensity;
        if (update.isLandlocked !== undefined) country.isLandlocked = update.isLandlocked;
        if (update.currencies !== undefined) {
            country.currencies = update.currencies.map(code => this.requireMapped(currencyMap, code, 'currency'));
        }
        if (update.languages !== undefined) {
            country.languages = update.languages.map(code => this.requireMapped(languageMap, code, 'language'));
        }
    }

    private async loadCountryResponses(countryCodes: string[]): Promise<CountryResponseDto[]> {
        const result = await this.countryRepository.find({
            where: { code: In(countryCodes) },
            relations: ['currencies', 'languages'],
        });

        const borders = await this.borderRepository.find({
            where: [{ country1_code: In(countryCodes) }, { country2_code: In(countryCodes) }],
        });

        return result.map(country => this.toCountryResponse(country, borders));
    }

    private toCountryResponse(country: Country, borders: Border[]): CountryResponseDto {
        return {
            ...country,
            borders: borders
                .filter(border => border.country1_code === country.code || border.country2_code === country.code)
                .map(border => (border.country1_code === country.code ? border.country2_code : border.country1_code)),
        };
    }

    private collectCodes(
        updates: Record<string, CountryFieldUpdate>,
        picker: (update: CountryFieldUpdate) => string[] | undefined,
    ): string[] {
        return Array.from(
            new Set(
                Object.values(updates).flatMap(update => {
                    const codes = picker(update);
                    return codes ?? [];
                }),
            ),
        );
    }

    private async getCodeMap<T extends { code: string }>(
        repository: Repository<T>,
        codes: string[],
        label: string,
        findOptions: FindManyOptions<T> = {},
    ): Promise<Map<string, T>> {
        if (codes.length === 0) {
            return new Map();
        }

        const entities = await repository.find({
            ...findOptions,
            where: { code: In(codes) } as FindOptionsWhere<T>,
        });

        const entityMap = new Map<string, T>();
        for (const entity of entities) {
            entityMap.set(entity.code, entity);
        }

        const invalidCodes = codes.filter(code => !entityMap.has(code));
        if (invalidCodes.length > 0) {
            throw new BadRequestException(`Invalid ${label} code(s): ${invalidCodes.join(', ')}`);
        }

        return entityMap;
    }

    private async loadCountryMap(
        updates: Record<string, CountryFieldUpdate>,
        createMissing: boolean,
    ): Promise<Map<string, Country>> {
        const codes = Object.keys(updates);
        if (!createMissing) {
            return this.getCodeMap(this.countryRepository, codes, 'country', {
                relations: ['currencies', 'languages'],
            });
        }

        const countries = await this.countryRepository.find({
            where: { code: In(codes) },
            relations: ['currencies', 'languages'],
        });
        const countryMap = new Map(countries.map(country => [country.code, country]));

        for (const code of codes) {
            if (countryMap.has(code)) {
                continue;
            }

            const update = updates[code];
            if (update.name === undefined || update.flag === undefined) {
                throw new BadRequestException(`Cannot create country ${code} without name and flag`);
            }

            countryMap.set(
                code,
                this.countryRepository.create({
                    code,
                    name: update.name,
                    flag: update.flag,
                }),
            );
        }

        return countryMap;
    }

    private requireMapped<T>(map: Map<string, T>, code: string, label: string): T {
        const value = map.get(code);
        if (value === undefined) {
            throw new BadRequestException(`Invalid ${label} code(s): ${code}`);
        }
        return value;
    }

    private async updateBorders(
        updates: Record<string, CountryFieldUpdate>,
        transactionalEntityManager: EntityManager,
    ): Promise<void> {
        const borderUpdates = new Map<string, string[]>();
        for (const [code, update] of Object.entries(updates)) {
            if (update.borders !== undefined) {
                borderUpdates.set(code, update.borders);
            }
        }

        if (borderUpdates.size === 0) {
            return;
        }

        const borderCountryCodes = Array.from(borderUpdates.keys());
        await transactionalEntityManager.delete(Border, [
            { country1_code: In(borderCountryCodes) },
            { country2_code: In(borderCountryCodes) },
        ]);

        const newBorders: Border[] = [];
        const processedPairs = new Set<string>();

        for (const [code, borders] of borderUpdates) {
            for (const borderCode of borders) {
                const pairKey = [code, borderCode].sort().join('-');

                if (!processedPairs.has(pairKey)) {
                    newBorders.push(new Border(code, borderCode));
                    processedPairs.add(pairKey);
                }
            }
        }

        if (newBorders.length > 0) {
            await transactionalEntityManager.save(Border, newBorders);
        }
    }
}
