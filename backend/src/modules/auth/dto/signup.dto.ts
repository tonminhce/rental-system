import {
  IsEmail,
  IsNotEmpty,
  Matches,
  MinLength,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  // Anchored, no /g — the old unanchored stateful pattern matched substrings.
  @Matches(/^(?:\+?84[0-9]{9}|0[35789][0-9]{8})$/, {
    message:
      'Phone number must be a Vietnamese phone number. Ex: 0828696919 or +84828696919',
  })
  phone?: string;

  @IsEnum(['user', 'rental'])
  role: string = 'user';
} 