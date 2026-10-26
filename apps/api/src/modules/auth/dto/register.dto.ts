import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  IsValidPassword,
} from './password-policy';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @IsValidPassword()
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/\S/, { message: 'O nome não pode conter apenas espaços' })
  name!: string;
}
