import { Border } from './border.entity';

describe('Border', () => {
    it('should store codes in ascending order when country1 is smaller', () => {
        const border = new Border('CAN', 'USA');

        expect(border.country1_code).toBe('CAN');
        expect(border.country2_code).toBe('USA');
    });

    it('should swap codes when country1 is larger', () => {
        const border = new Border('USA', 'CAN');

        expect(border.country1_code).toBe('CAN');
        expect(border.country2_code).toBe('USA');
    });
});
