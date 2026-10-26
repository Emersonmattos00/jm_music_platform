import { Matches } from 'class-validator';

// Regra centralizada para toda a plataforma
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).+$/;
export const PASSWORD_MESSAGE = 'A senha deve conter letras e números';

// Decorator reutilizável
export function IsValidPassword() {
  return Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE });
}
