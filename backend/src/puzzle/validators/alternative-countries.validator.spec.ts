import { validate } from 'class-validator';

import { HasMinLengthForInnerArrays } from './alternative-countries.validator';

class TestDto {
    @HasMinLengthForInnerArrays()
    alternativeCountries: unknown;
}

describe('HasMinLengthForInnerArrays', () => {
    it('should accept arrays whose inner arrays each have at least one element', async () => {
        const dto = new TestDto();
        dto.alternativeCountries = [['OMN'], ['UAE', 'BHR']];

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
    });

    it('should reject a non-array value', async () => {
        const dto = new TestDto();
        dto.alternativeCountries = 'not-an-array';

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].constraints?.hasMinLengthForInnerArrays).toBe(
            'Each inner array in alternativeCountries must contain at least one element',
        );
    });

    it('should reject empty inner arrays', async () => {
        const dto = new TestDto();
        dto.alternativeCountries = [[]];

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].constraints?.hasMinLengthForInnerArrays).toContain('at least one element');
    });

    it('should reject inner values that are not arrays', async () => {
        const dto = new TestDto();
        dto.alternativeCountries = ['OMN'];

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
    });
});
