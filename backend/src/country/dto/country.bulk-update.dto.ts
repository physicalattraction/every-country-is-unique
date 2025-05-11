import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

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
}

export type CountryBulkUpdateDto = Record<string, CountryBulkUpdateItemDto>;
