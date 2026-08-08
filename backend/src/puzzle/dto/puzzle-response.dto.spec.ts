import { PuzzleResponseDto } from './puzzle-response.dto';

describe('PuzzleResponseDto', () => {
    it('should map puzzle fields including clues', () => {
        const dto = new PuzzleResponseDto({
            id: 1,
            country: { code: 'QAT', name: 'Qatar', flag: '🇶🇦' } as never,
            clues: [{ id: 1, source: 'name', key: 'letters', value: '5' } as never],
            alternativeCountries: [['OMN']],
            deduplicationKey: 'key',
        });

        expect(dto.id).toBe(1);
        expect(dto.clues).toHaveLength(1);
        expect(dto.alternativeCountries).toEqual([['OMN']]);
        expect(dto.deduplicationKey).toBe('key');
    });

    it('should no-op when constructed without a puzzle', () => {
        const dto = new PuzzleResponseDto(undefined as never);

        expect(dto.id).toBeUndefined();
        expect(dto.clues).toBeUndefined();
    });

    it('should default clues to an empty array when puzzle clues are missing', () => {
        const dto = new PuzzleResponseDto({
            id: 2,
            country: { code: 'QAT', name: 'Qatar', flag: '🇶🇦' } as never,
            deduplicationKey: 'key-2',
        });

        expect(dto.clues).toEqual([]);
    });
});
