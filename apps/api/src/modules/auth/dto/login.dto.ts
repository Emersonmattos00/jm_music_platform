import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH } from './password-policy';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(PASSWORD_MAX_LENGTH) // Evita DoS com payloads gigantes
  password!: string;
}
