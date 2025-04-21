import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

import { HasMinLengthForInnerArrays } from '../validators/alternative-countries.validator';
import { CreateClueDto } from './create-puzzle.dto';

export class UpdatePuzzleDto {
    @ApiProperty({ description: 'The country code for the puzzle' })
    @IsString()
    @IsNotEmpty()
    countryCode: string;

    @ApiProperty({ description: 'The clues for the puzzle', type: [CreateClueDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateClueDto)
    clues: CreateClueDto[];

    @ApiProperty({
        description: 'For each clue, an array of country codes that would match all other clues except this one. Each inner array must contain at least one country code.',
        type: 'array',
        items: {
            type: 'array',
            items: {
                type: 'string'
            }
        }
    })
    @IsArray()
    @HasMinLengthForInnerArrays()
    alternativeCountries: string[][];
}
