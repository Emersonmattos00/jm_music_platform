import { registerDecorator, ValidationOptions } from 'class-validator';

// ISRC: 12 caracteres, formato CC-XXX-YY-NNNNN (aceita sem hífens)
// Exemplos válidos: BR-JM1-26-00001, BRJM12600 001, brjm12600001
const ISRC_REGEX = /^[A-Za-z]{2}[A-Za-z0-9]{3}\d{2}\d{5}$/;

// UPC: 12 dígitos numéricos
const UPC_REGEX = /^\d{12}$/;

export function IsISRC(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isISRC',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (value === null || value === undefined || value === '') return true;
          if (typeof value !== 'string') return false;
          // Remove hífens e espaços
          const clean = value.replace(/[-\s]/g, '').toUpperCase();
          return ISRC_REGEX.test(clean);
        },
        defaultMessage() {
          return 'ISRC inválido. Formato esperado: CC-XXX-YY-NNNNN (ex: BR-JM1-26-00001)';
        },
      },
    });
  };
}

export function IsUPC(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUPC',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (value === null || value === undefined || value === '') return true;
          if (typeof value !== 'string') return false;
          const clean = value.replace(/[-\s]/g, '');
          return UPC_REGEX.test(clean);
        },
        defaultMessage() {
          return 'UPC inválido. Formato esperado: 12 dígitos numéricos';
        },
      },
    });
  };
}

// Normaliza ISRC: remove hífens e deixa maiúsculo
export function normalizeISRC(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.replace(/[-\s]/g, '').toUpperCase();
}

// Normaliza UPC: remove hífens e espaços
export function normalizeUPC(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.replace(/[-\s]/g, '');
}