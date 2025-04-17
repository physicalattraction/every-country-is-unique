import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CountryQueryDto {
    @ApiProperty({ description: 'Search term to filter countries by name', required: false })
    @IsOptional()
    @IsString()
    search?: string;
}
