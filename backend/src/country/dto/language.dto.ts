import { ApiProperty } from '@nestjs/swagger';

export class LanguageDto {
    @ApiProperty({ description: 'The three-letter language code' })
    code: string;

    @ApiProperty({ description: 'The name of the language' })
    name: string;
}
