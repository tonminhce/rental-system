import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class SignupDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;
    @IsNotEmpty()
    @MinLength(6)
    password: string;
    @IsNotEmpty()
    role: 'user' | 'rental';
}
