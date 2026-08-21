import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
  } from 'class-validator';
  
  export function IsNotBlank(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
      registerDecorator({
        name: 'isNotBlank',
        target: object.constructor,
        propertyName,
        options: validationOptions,
        validator: {
          validate(value: any, _args: ValidationArguments) {
            return typeof value === 'string' && value.trim().length > 0;
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} should not be empty or contain only whitespace.`;
          },
        },
      });
    };
  }
  