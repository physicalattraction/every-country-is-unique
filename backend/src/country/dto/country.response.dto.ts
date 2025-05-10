import { ApiProperty } from '@nestjs/swagger';

import { CurrencyDto } from './currency.dto';
import { LanguageDto } from './language.dto';

export class CountryResponseDto {
    @ApiProperty({ description: 'The three-letter country code' })
    code: string;

    @ApiProperty({ description: 'The name of the country' })
    name: string;

    @ApiProperty({ description: 'The flag emoji of the country' })
    flag: string;

    @ApiProperty({ description: 'The currencies used in the country', type: [CurrencyDto], required: false })
    currencies?: CurrencyDto[];

    @ApiProperty({ description: 'The languages spoken in the country', type: [LanguageDto], required: false })
    languages?: LanguageDto[];

    @ApiProperty({ description: 'The population of the country', required: false, type: Number })
    population?: number;

    @ApiProperty({ description: 'The area of the country in square kilometers', required: false, type: Number })
    area?: number;

    @ApiProperty({
        description: 'The population density of the country (people per sq km)',
        required: false,
        type: Number,
    })
    populationDensity?: number;
}
