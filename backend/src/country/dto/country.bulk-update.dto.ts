import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsBoolean, IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class CountryBulkUpdateItemDto {
    @ApiProperty({
        description: 'The name of the country',
        example: 'United States of America',
        required: false,
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        description: 'The flag emoji of the country',
        example: '🇺🇸',
        required: false,
    })
    @IsString()
    @IsOptional()
    flag?: string;

    @ApiProperty({
        description: 'The population of the country',
        example: 333000000,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    population?: number;

    @ApiProperty({
        description: 'The area of the country in square kilometers',
        example: 9834000,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    area?: number;

    @ApiProperty({
        description: 'The population density of the country (people per square kilometer)',
        example: 33.9,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    populationDensity?: number;

    @ApiProperty({
        description: 'Array of currency codes used in the country',
        example: ['USD'],
        required: false,
        type: [String],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    @IsOptional()
    currencies?: string[];

    @ApiProperty({
        description: 'Array of language codes spoken in the country',
        example: ['eng', 'spa'],
        required: false,
        type: [String],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    @IsOptional()
    languages?: string[];

    @ApiProperty({
        description: 'Whether the country is landlocked (has no coastline)',
        example: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
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

/**
 * Dictionary of three-letter country codes to partial country updates
 */
export type CountryBulkUpdateDto = Record<string, CountryBulkUpdateItemDto>;
