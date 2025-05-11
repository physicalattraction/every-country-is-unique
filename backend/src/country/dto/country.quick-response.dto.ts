import { ApiProperty } from '@nestjs/swagger';

export class CountryQuickResponseDto {
    @ApiProperty({ description: 'The three-letter country code' })
    code: string;

    @ApiProperty({ description: 'The name of the country' })
    name: string;

    @ApiProperty({ description: 'The flag emoji of the country' })
    flag: string;
}
