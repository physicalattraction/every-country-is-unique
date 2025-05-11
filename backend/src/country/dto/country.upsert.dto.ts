import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class CountryUpsertDto {
    @ApiProperty({ description: 'The three-letter country code' })
    @IsString()
    @Matches(/^[A-Z]{3}$/, { message: 'Country code must be exactly 3 uppercase letters' })
    code: string;

    @ApiProperty({ description: 'The name of the country' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'The flag emoji of the country' })
    @IsString()
    flag: string;

    @ApiProperty({ description: 'The currency codes used in the country', type: [String], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    currencyCodes?: string[];

    @ApiProperty({ description: 'The language codes spoken in the country', type: [String], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    languageCodes?: string[];

    @ApiProperty({ description: 'The population of the country', required: false, type: Number })
    @IsOptional()
    @IsNumber()
    population?: number;

    @ApiProperty({ description: 'The area of the country in square kilometers', required: false, type: Number })
    @IsOptional()
    @IsNumber()
    area?: number;

    @ApiProperty({
        description: 'The population density of the country (people per sq km)',
        required: false,
        type: Number,
    })
    @IsOptional()
    @IsNumber()
    populationDensity?: number;

    @ApiProperty({
        description: 'Whether the country is landlocked (has no coastline)',
        required: false,
        type: Boolean,
    })
    @IsOptional()
    @IsBoolean()
    isLandlocked?: boolean;

    @ApiProperty({
        description:
            'An array of country codes representing the countries that share a land border with this country. The relationship is symmetric (if country A borders country B, then country B borders country A).',
        type: [String],
        example: ['MEX', 'CAN'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Matches(/^[A-Z]{3}$/, { each: true, message: 'Each border country code must be exactly 3 uppercase letters' })
    borders?: string[];
}
