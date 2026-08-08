import { BadRequestException, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';

import { CountryBulkUpdateDto, CountryBulkUpdateItemDto } from '../dto/country.bulk-update.dto';

const COUNTRY_CODE_PATTERN = /^[A-Z]{3}$/;

function flattenValidationErrors(code: string, errors: ValidationError[]): string[] {
    const messages: string[] = [];
    for (const error of errors) {
        if (error.constraints) {
            messages.push(...Object.values(error.constraints).map(message => `${code}.${error.property}: ${message}`));
        }
        if (error.children?.length) {
            messages.push(...flattenValidationErrors(`${code}.${error.property}`, error.children));
        }
    }
    return messages;
}

/**
 * Validate and transform a bulk-update map body that ValidationPipe cannot see as nested DTOs
 */
export class CountryBulkUpdatePipe implements PipeTransform<unknown, CountryBulkUpdateDto> {
    transform(value: unknown): CountryBulkUpdateDto {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new BadRequestException('Bulk update body must be an object keyed by country codes');
        }

        const entries = Object.entries(value as Record<string, unknown>);
        if (entries.length === 0) {
            throw new BadRequestException('Bulk update body must contain at least one country update');
        }

        const result: CountryBulkUpdateDto = {};
        const messages: string[] = [];

        for (const [code, item] of entries) {
            if (!COUNTRY_CODE_PATTERN.test(code)) {
                messages.push(`Invalid country code key '${code}'. Expected exactly 3 uppercase letters.`);
                continue;
            }

            if (!item || typeof item !== 'object' || Array.isArray(item)) {
                messages.push(`Update for '${code}' must be an object`);
                continue;
            }

            const instance = plainToInstance(CountryBulkUpdateItemDto, item);
            const errors = validateSync(instance, {
                whitelist: true,
                forbidNonWhitelisted: true,
            });

            if (errors.length > 0) {
                messages.push(...flattenValidationErrors(code, errors));
                continue;
            }

            result[code] = instance;
        }

        if (messages.length > 0) {
            throw new BadRequestException(messages);
        }

        return result;
    }
}
