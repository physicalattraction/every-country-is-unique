import { BadRequestException } from '@nestjs/common';
import * as classValidator from 'class-validator';

import { CountryBulkUpdatePipe } from './country-bulk-update.pipe';

function getPipeMessages(action: () => unknown): string[] {
    try {
        action();
        throw new Error('Expected BadRequestException');
    } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse();
        if (typeof response === 'string') {
            return [response];
        }
        const message = (response as { message: string | string[] }).message;
        return Array.isArray(message) ? message : [message];
    }
}

describe('CountryBulkUpdatePipe', () => {
    const pipe = new CountryBulkUpdatePipe();

    it('should transform a valid bulk update body', () => {
        const result = pipe.transform({
            USA: { name: 'United States', population: 100 },
        });

        expect(result).toEqual({
            USA: expect.objectContaining({
                name: 'United States',
                population: 100,
            }),
        });
    });

    it('should reject a non-object body', () => {
        expect(getPipeMessages(() => pipe.transform(null))).toEqual([
            'Bulk update body must be an object keyed by country codes',
        ]);
        expect(getPipeMessages(() => pipe.transform([]))).toEqual([
            'Bulk update body must be an object keyed by country codes',
        ]);
        expect(getPipeMessages(() => pipe.transform('USA'))).toEqual([
            'Bulk update body must be an object keyed by country codes',
        ]);
    });

    it('should reject an empty object body', () => {
        expect(getPipeMessages(() => pipe.transform({}))).toEqual([
            'Bulk update body must contain at least one country update',
        ]);
    });

    it('should reject invalid country code keys', () => {
        const messages = getPipeMessages(() =>
            pipe.transform({
                us: { name: 'United States' },
            }),
        );

        expect(messages.join(' ')).toContain("Invalid country code key 'us'");
    });

    it('should reject non-object update values', () => {
        expect(
            getPipeMessages(() =>
                pipe.transform({
                    USA: 'not-an-object',
                }),
            ).join(' '),
        ).toContain("Update for 'USA' must be an object");

        expect(
            getPipeMessages(() =>
                pipe.transform({
                    USA: [],
                }),
            ).join(' '),
        ).toContain("Update for 'USA' must be an object");
    });

    it('should reject invalid field types on update items', () => {
        const messages = getPipeMessages(() =>
            pipe.transform({
                USA: { population: 'not-a-number' },
            }),
        );

        expect(messages.join(' ')).toContain('USA.population');
    });

    it('should reject nested validation errors on array fields', () => {
        const messages = getPipeMessages(() =>
            pipe.transform({
                USA: { borders: ['usa'] },
            }),
        );

        expect(messages.join(' ')).toContain('border country code');
    });

    it('should aggregate multiple validation messages', () => {
        const messages = getPipeMessages(() =>
            pipe.transform({
                us: { name: 'Bad key' },
                USA: null,
            }),
        );

        expect(messages).toEqual(
            expect.arrayContaining([
                expect.stringContaining("Invalid country code key 'us'"),
                expect.stringContaining("Update for 'USA' must be an object"),
            ]),
        );
    });

    it('should flatten nested validation errors', () => {
        const validateSpy = jest.spyOn(classValidator, 'validateSync').mockReturnValueOnce([
            {
                property: 'currencies',
                children: [
                    {
                        property: '0',
                        constraints: {
                            isString: 'each value in currencies must be a string',
                        },
                        children: [],
                    },
                ],
            },
        ] as classValidator.ValidationError[]);

        const messages = getPipeMessages(() =>
            pipe.transform({
                USA: { currencies: [1 as unknown as string] },
            }),
        );

        expect(messages).toEqual(
            expect.arrayContaining([expect.stringContaining('USA.currencies.0: each value in currencies must be a string')]),
        );
        validateSpy.mockRestore();
    });
});
