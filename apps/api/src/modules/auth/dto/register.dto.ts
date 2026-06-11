import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().toLowerCase();
};

const trimString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
};

export class RegisterDto {
  @IsEmail()
  @MaxLength(255)
  @Transform(normalizeEmail)
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(trimString)
  fullName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
