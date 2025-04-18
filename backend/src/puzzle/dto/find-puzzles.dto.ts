import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, Min } from 'class-validator';

export class FindPuzzlesDto {
    @ApiProperty({ description: 'Filter puzzles by country code', required: false })
    @IsOptional()
    @IsString()
    country_code?: string;

    @ApiProperty({ description: 'Page number for pagination', required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    page?: number = 1;

    @ApiProperty({ description: 'Number of items per page', required: false, default: 20 })
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    limit?: number = 20;
}
