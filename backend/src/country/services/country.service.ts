import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';

import { CountryBulkUpdateDto, CountryBulkUpdateItemDto } from '../dto/country.bulk-update.dto';
import { CountryQueryDto } from '../dto/country.query.dto';
import { CountryQuickResponseDto } from '../dto/country.quick-response.dto';
import { CountryResponseDto } from '../dto/country.response.dto';
import { CountryUpsertDto } from '../dto/country.upsert.dto';
import { Border } from '../entities/border.entity';
import { Country } from '../entities/country.entity';
import { Currency } from '../entities/currency.entity';
import { Language } from '../entities/language.entity';

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
        const {
            code,
            name,
            flag,
            currencyCodes,
            languageCodes,
            population,
            area,
            populationDensity,
            isLandlocked,
            borders,
        } = dto;

        // Find or create the country
        let country = await this.countryRepository.findOne({
            where: { code },
            relations: ['currencies', 'languages'],
        });

        if (!country) {
            country = this.countryRepository.create({ code, name, flag });
        } else {
            country.name = name;
            country.flag = flag;
        }

        // Set new optional fields if provided
        if (population !== undefined) country.population = population;
        if (area !== undefined) country.area = area;
        if (populationDensity !== undefined) country.populationDensity = populationDensity;
        if (isLandlocked !== undefined) country.isLandlocked = isLandlocked;

        // Handle currencies if provided
        if (currencyCodes) {
            country.currencies = await this.currencyRepository.findBy({
                code: In(currencyCodes),
            });
        }

        // Handle languages if provided
        if (languageCodes) {
            country.languages = await this.languageRepository.findBy({
                code: In(languageCodes),
            });
        }

        // Save the country first to ensure it exists
        const savedCountry = await this.countryRepository.save(country);

        // Handle borders if provided
        if (borders) {
            // Delete all existing borders for this country
            await this.borderRepository.delete({
                country1_code: code,
            });
            await this.borderRepository.delete({
                country2_code: code,
            });

            // Create new border entries
            const borderEntities = borders.map(borderCode => new Border(code, borderCode));
            await this.borderRepository.save(borderEntities);
        }

        return this.findOne(savedCountry.code);
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
        const countryCodes = Object.keys(updates);
        const countryMap = await this.getCountryMapFromUpdates(updates);
        const currencyMap = await this.getCodeMap(
            this.currencyRepository,
            this.collectCodes(updates, update => update.currencies),
            'currency',
        );
        const languageMap = await this.getCodeMap(
            this.languageRepository,
            this.collectCodes(updates, update => update.languages),
            'language',
        );

        const updatedCountries: Country[] = [];

        await this.countryRepository.manager.transaction(async transactionalEntityManager => {
            await this.updateBorders(updates, transactionalEntityManager);

            for (const code of countryCodes) {
                const update = updates[code];
                const country = countryMap.get(code)!;

                if (update.name !== undefined) country.name = update.name;
                if (update.flag !== undefined) country.flag = update.flag;
                if (update.population !== undefined) country.population = update.population;
                if (update.area !== undefined) country.area = update.area;
                if (update.populationDensity !== undefined) country.populationDensity = update.populationDensity;
                if (update.isLandlocked !== undefined) country.isLandlocked = update.isLandlocked;
                if (update.currencies !== undefined) {
                    country.currencies = update.currencies.map(c => currencyMap.get(c)!);
                }
                if (update.languages !== undefined) {
                    country.languages = update.languages.map(l => languageMap.get(l)!);
                }

                updatedCountries.push(country);
            }

            await transactionalEntityManager.save(Country, updatedCountries);
        });

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
        updates: CountryBulkUpdateDto,
        picker: (update: CountryBulkUpdateItemDto) => string[] | undefined,
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
    ): Promise<Map<string, T>> {
        if (codes.length === 0) {
            return new Map();
        }

        const entities = await repository.find({
            where: { code: In(codes) } as object,
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

    private async updateBorders(updates: CountryBulkUpdateDto, transactionalEntityManager: EntityManager) {
        const countryCodes = Object.keys(updates);
        if (countryCodes.length === 0) {
            return;
        }

        const borderUpdates = new Map<string, string[]>();
        for (const code of countryCodes) {
            const update = updates[code];
            if (update.borders !== undefined) {
                borderUpdates.set(code, update.borders);
            }
        }

        if (borderUpdates.size > 0) {
            await transactionalEntityManager.delete(Border, [
                { country1_code: In(Array.from(borderUpdates.keys())) },
                { country2_code: In(Array.from(borderUpdates.keys())) },
            ]);
        }

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

    /**
     * Collect country codes from updates, fetch countries, and validate codes
     *
     * @param updates - The updates to be applied to the countries
     * @returns A map of country codes to their corresponding Country entities
     * @throws BadRequestException if any country code is invalid
     */
    private async getCountryMapFromUpdates(updates: CountryBulkUpdateDto): Promise<Map<string, Country>> {
        const codes = Object.keys(updates);

        const countries = await this.countryRepository.find({
            where: { code: In(codes) },
            relations: ['currencies', 'languages'],
        });

        const countryMap = new Map<string, Country>();
        for (const country of countries) {
            countryMap.set(country.code, country);
        }

        const invalidCodes = codes.filter(code => !countryMap.has(code));
        if (invalidCodes.length > 0) {
            throw new BadRequestException(`Invalid country code(s): ${invalidCodes.join(', ')}`);
        }

        return countryMap;
    }
}
