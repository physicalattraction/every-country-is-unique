import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { CountryQueryDto } from '../dto/country.query.dto';
import { CountryResponseDto } from '../dto/country.response.dto';
import { CountryUpsertDto } from '../dto/country.upsert.dto';
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
    ) {
        // Nothing to do here
    }

    async findAll(query: CountryQueryDto): Promise<CountryResponseDto[]> {
        const { search } = query;

        const queryBuilder = this.countryRepository.createQueryBuilder('country');

        if (search) {
            queryBuilder.where('LOWER(country.name) LIKE LOWER(:search)', { search: `%${search}%` });
        }

        return queryBuilder.orderBy('country.name', 'ASC').getMany();
    }

    async findOne(code: string): Promise<CountryResponseDto> {
        const country = await this.countryRepository.findOne({
            where: { code },
            relations: ['currencies', 'languages'],
        });

        if (!country) {
            throw new NotFoundException(`Country with code ${code} not found`);
        }
        return country;
    }

    async upsert(dto: CountryUpsertDto): Promise<CountryResponseDto> {
        const { code, name, flag, currencyCodes, languageCodes, population, area, populationDensity } = dto;

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

        // Handle currencies if provided
        if (currencyCodes) {
            const currencies = await this.currencyRepository.findBy({
                code: In(currencyCodes),
            });
            country.currencies = currencies;
        }

        // Handle languages if provided
        if (languageCodes) {
            const languages = await this.languageRepository.findBy({
                code: In(languageCodes),
            });
            country.languages = languages;
        }

        // Save the country with its relationships
        return this.countryRepository.save(country);
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

    async bulkUpdateCountries(updates: Record<string, Partial<Country>>): Promise<CountryResponseDto[]> {
        const codes = Object.keys(updates);

        const countryMap = await this.getCountryMapFromUpdates(updates);
        const currencyMap = await this.getCurrencyMapFromUpdates(updates);
        const languageMap = await this.getLanguageMapFromUpdates(updates);

        // Collect updated countries here
        const updatedCountries: Country[] = [];

        await this.countryRepository.manager.transaction(async transactionalEntityManager => {
            for (const code of codes) {
                const update = updates[code];
                const country = countryMap.get(code);

                // For each field in the update object, validate and update if allowed
                for (const key of Object.keys(update)) {
                    switch (key) {
                        case 'name':
                            if (typeof update.name !== 'string') {
                                throw new BadRequestException(
                                    `Invalid type for 'name' in country code '${code}'. Expected string.`,
                                );
                            }
                            country.name = update.name;
                            break;
                        case 'flag':
                            if (typeof update.flag !== 'string') {
                                throw new BadRequestException(
                                    `Invalid type for 'flag' in country code '${code}'. Expected string.`,
                                );
                            }
                            country.flag = update.flag;
                            break;
                        case 'population':
                            if (typeof update.population !== 'number') {
                                throw new BadRequestException(
                                    `Invalid type for 'population' in country code '${code}'. Expected number.`,
                                );
                            }
                            country.population = update.population;
                            break;
                        case 'area':
                            if (typeof update.area !== 'number') {
                                throw new BadRequestException(
                                    `Invalid type for 'area' in country code '${code}'. Expected number.`,
                                );
                            }
                            country.area = update.area;
                            break;
                        case 'populationDensity':
                            if (typeof update.populationDensity !== 'number') {
                                throw new BadRequestException(
                                    `Invalid type for 'populationDensity' in country code '${code}'. Expected number.`,
                                );
                            }
                            country.populationDensity = update.populationDensity;
                            break;
                        case 'currencies':
                            if (
                                !Array.isArray(update.currencies) ||
                                !update.currencies.every(c => typeof c === 'string') ||
                                update.currencies.length === 0
                            ) {
                                throw new BadRequestException(
                                    `Invalid type for 'currencies' in country code '${code}'. Expected a non-empty array of strings.`,
                                );
                            }
                            const currencyCodes = update.currencies as string[];
                            country.currencies = currencyCodes.map(c => currencyMap.get(c)!);
                            break;
                        case 'languages':
                            if (
                                !Array.isArray(update.languages) ||
                                !update.languages.every(l => typeof l === 'string') ||
                                update.languages.length === 0
                            ) {
                                throw new BadRequestException(
                                    `Invalid type for 'languages' in country code '${code}'. Expected a non-empty array of strings.`,
                                );
                            }
                            const languageCodes = update.languages as string[];
                            country.languages = languageCodes.map(l => languageMap.get(l)!);
                            break;
                        default:
                            // Throw if the field is not allowed
                            throw new BadRequestException(
                                `Invalid field '${key}' in update for country code '${code}'. Allowed fields are: name, flag, population, area, populationDensity, currencies, languages`,
                            );
                    }
                }
                // Collect the updated country for bulk save
                updatedCountries.push(country);
            }
            // Save all updated countries in a single DB call
            await transactionalEntityManager.save(Country, updatedCountries);
        });

        // Re-fetch the updated countries with relations to ensure the response is correct
        const result = await this.countryRepository.find({
            where: { code: In(codes) },
            relations: ['currencies', 'languages'],
        });
        return result;
    }

    /**
     * Collect all unique country codes from updates, fetch all countries, build countryMap, and validate codes
     *
     * @param updates - The updates to be applied to the countries
     * @returns A map of country codes to their corresponding Country entities
     * @throws BadRequestException if any country code is invalid
     */
    private async getCountryMapFromUpdates(updates: Record<string, Partial<Country>>): Promise<Map<string, Country>> {
        const codes = Object.keys(updates);

        // Fetch all countries in one query
        const countries = await this.countryRepository.find({
            where: { code: In(codes) },
            relations: ['currencies', 'languages'],
        });

        // Build a map of country codes to their corresponding Country entities
        const countryMap = new Map<string, Country>();
        for (const country of countries) {
            countryMap.set(country.code, country);
        }

        // Validate that all country codes are valid
        const invalidCodes = codes.filter(code => !countryMap.has(code));
        if (invalidCodes.length > 0) {
            throw new BadRequestException(`Invalid country code(s): ${invalidCodes.join(', ')}`);
        }

        return countryMap;
    }

    /**
     * Collect all unique currency codes from all updates, fetch all currencies, build currencyMap, and validate codes
     *
     * @param updates - The updates to be applied to the countries
     * @returns A map of currency codes to their corresponding Currency entities
     * @throws BadRequestException if any currency code is invalid
     */
    private async getCurrencyMapFromUpdates(updates: Record<string, Partial<Country>>): Promise<Map<string, Currency>> {
        // Get all the codes from the updates
        const codes = Object.keys(updates);
        const allCurrencyCodes: string[] = Array.from(
            new Set(
                codes.flatMap(code => {
                    const curr = updates[code].currencies;
                    return Array.isArray(curr) && curr.every(c => typeof c === 'string') ? curr : [];
                }),
            ),
        );

        // Fetch all currencies in one query
        const allCurrencies = await this.currencyRepository.find({ where: { code: In(allCurrencyCodes) } });

        // Build a map of currency codes to their corresponding Currency entities
        const currencyMap = new Map<string, Currency>();
        for (const currency of allCurrencies) {
            currencyMap.set(currency.code, currency);
        }

        // Validate that all currency codes are valid
        const invalidCurrencyCodes = allCurrencyCodes.filter(code => !currencyMap.has(code));
        if (invalidCurrencyCodes.length > 0) {
            throw new BadRequestException(`Invalid currency code(s): ${invalidCurrencyCodes.join(', ')}`);
        }
        return currencyMap;
    }

    /**
     * Collect all unique language codes from updates, fetch all languages, build languageMap, and validate codes
     *
     * @param updates - The updates to be applied to the countries
     * @returns A map of language codes to their corresponding Language entities
     * @throws BadRequestException if any language code is invalid
     */
    private async getLanguageMapFromUpdates(updates: Record<string, Partial<Country>>): Promise<Map<string, Language>> {
        const codes = Object.keys(updates);
        const allLanguageCodes: string[] = Array.from(
            new Set(
                codes.flatMap(code => {
                    const langs = updates[code].languages;
                    return Array.isArray(langs) && langs.every(l => typeof l === 'string') ? langs : [];
                }),
            ),
        );

        // Fetch all languages in one query
        const allLanguages = await this.languageRepository.find({ where: { code: In(allLanguageCodes) } });

        // Build a map of language codes to their corresponding Language entities
        const languageMap = new Map<string, Language>();
        for (const language of allLanguages) {
            languageMap.set(language.code, language);
        }

        // Validate that all language codes are valid
        const invalidLanguageCodes = allLanguageCodes.filter(code => !languageMap.has(code));
        if (invalidLanguageCodes.length > 0) {
            throw new BadRequestException(`Invalid language code(s): ${invalidLanguageCodes.join(', ')}`);
        }

        return languageMap;
    }
}
