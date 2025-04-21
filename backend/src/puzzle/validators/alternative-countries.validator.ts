import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function HasMinLengthForInnerArrays(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'hasMinLengthForInnerArrays',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (!Array.isArray(value)) {
                        return false;
                    }
                    return value.every(innerArray =>
                        Array.isArray(innerArray) && innerArray.length >= 1
                    );
                },
                defaultMessage(args: ValidationArguments) {
                    return 'Each inner array in $property must contain at least one element';
                },
            },
        });
    };
} 