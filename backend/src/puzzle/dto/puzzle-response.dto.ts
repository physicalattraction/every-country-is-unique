import { ApiProperty } from '@nestjs/swagger';

import { Country } from '../../country/entities/country.entity';
import { ClueInput, ClueResponseDto } from './clue-response.dto';

export interface PuzzleInput {
    id: number;
    country: Country;
    clues?: ClueInput[];
}

export class PuzzleResponseDto {
    @ApiProperty({ description: 'The unique identifier of the puzzle' })
    id: number;

    @ApiProperty({ description: 'The country associated with the puzzle' })
    country: Country;

    @ApiProperty({ description: 'The clues associated with the puzzle', type: [ClueResponseDto] })
    clues: ClueResponseDto[];

    constructor(puzzle: PuzzleInput) {
        if (!puzzle) {
            return;
        }
        this.id = puzzle.id;
        this.country = puzzle.country;
        this.clues = puzzle.clues?.map(clue => new ClueResponseDto(clue)) || [];
    }
}
