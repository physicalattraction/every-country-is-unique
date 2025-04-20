import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

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
}
