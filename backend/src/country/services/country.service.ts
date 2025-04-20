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
    ) { }

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
        const { code, name, flag, currencyCodes, languageCodes } = dto;

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
            if (error.code === '23503' || // PostgreSQL foreign key violation code
                error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') { // SQLite foreign key violation code
                throw new BadRequestException(`Cannot delete country ${code} because it is still being used in puzzles`);
            }

            // Only log unexpected errors
            if (!(error instanceof NotFoundException) && !(error instanceof BadRequestException)) {
                this.logger.error(`Error deleting country ${code}:`, error);
            }

            // Re-throw other errors
            throw error;
        }
    }
}
