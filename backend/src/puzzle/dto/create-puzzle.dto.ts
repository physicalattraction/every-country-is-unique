import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class CreateClueDto {
    @IsString()
    @IsNotEmpty()
    source: string;

    @IsString()
    @IsNotEmpty()
    key: string;

    @IsString()
    @IsNotEmpty()
    value: string;
}

export class CreatePuzzleDto {
    @IsString()
    @IsNotEmpty()
    countryCode: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateClueDto)
    clues: CreateClueDto[];
} 