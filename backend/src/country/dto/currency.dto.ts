import { ApiProperty } from '@nestjs/swagger';

export class CurrencyDto {
    @ApiProperty({ description: 'The three-letter currency code' })
    code: string;

    @ApiProperty({ description: 'The name of the currency' })
    name: string;

    @ApiProperty({ description: 'The currency symbol', required: false })
    symbol?: string;
}
