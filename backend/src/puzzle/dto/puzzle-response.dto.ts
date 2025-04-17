import { Country } from '../../country/entities/country.entity';
import { ClueResponseDto } from './clue-response.dto';

export class PuzzleResponseDto {
    id: number;
    country: Country;
    clues: ClueResponseDto[];

    constructor(puzzle: any) {
        if (!puzzle) {
            return;
        }
        this.id = puzzle.id;
        this.country = puzzle.country;
        this.clues = puzzle.clues?.map(clue => new ClueResponseDto(clue)) || [];
    }
} 