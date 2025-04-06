import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
  } from 'class-validator';
  
  export function NoSpecialCharacters(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
      registerDecorator({
        name: 'noSpecialCharacters',
        target: object.constructor,
        propertyName,
        options: validationOptions,
        validator: {
          validate(value: any, _args: ValidationArguments) {
            if (typeof value !== 'string') return false;
            return /^[a-zA-Z0-9.\s]*$/.test(value);
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must not contain special characters.`;
          },
        },
      });
    };
  }
  