import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CountryQueryDto {
    @ApiProperty({ description: 'Search term to filter countries by name', required: false })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({
        description: 'Filter countries by landlocked status',
        required: false,
        type: Boolean,
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    isLandlocked?: boolean;
}
