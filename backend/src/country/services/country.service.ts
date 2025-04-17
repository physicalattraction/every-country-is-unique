import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CountryQueryDto } from '../dto/country.query.dto';
import { CountryResponseDto } from '../dto/country.response.dto';
import { Country } from '../entities/country.entity';

@Injectable()
export class CountryService {
    constructor(
        @InjectRepository(Country)
        private countryRepository: Repository<Country>,
    ) {}

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
}
