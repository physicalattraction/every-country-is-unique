import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CountryQueryDto } from './country.query.dto';

describe('CountryQueryDto', () => {
    it('should transform string booleans for isLandlocked', async () => {
        const trueDto = plainToInstance(CountryQueryDto, { isLandlocked: 'true' });
        const falseDto = plainToInstance(CountryQueryDto, { isLandlocked: 'false' });
        const passthroughDto = plainToInstance(CountryQueryDto, { isLandlocked: 'maybe' });

        expect(trueDto.isLandlocked).toBe(true);
        expect(falseDto.isLandlocked).toBe(false);
        expect(passthroughDto.isLandlocked).toBe('maybe');

        expect(await validate(trueDto)).toHaveLength(0);
        expect(await validate(falseDto)).toHaveLength(0);
        expect(await validate(passthroughDto)).toHaveLength(1);
    });
});
