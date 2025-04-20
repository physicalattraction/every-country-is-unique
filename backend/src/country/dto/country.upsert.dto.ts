import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, Length } from 'class-validator';

export class CountryUpsertDto {
    @ApiProperty({ description: 'The three-letter country code' })
    @IsString()
    @Length(3, 3)
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
} 