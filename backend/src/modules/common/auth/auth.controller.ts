import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ConfigService } from "@nestjs/config";
import { LoginDto } from '../dto/login.dto';
import { SignupDto } from '../dto/signup.dto';
import { Public } from 'src/decorator/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) { }

  @Public()
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    const result = await this.authService.signup(signupDto.email, signupDto.password, signupDto.role);
    if (!result) throw new BadRequestException("Invalid credentials!");

    return {
      message: "Sign up successful!",
      user: result.user
    };
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto.email, loginDto.password);
    if (!result) throw new BadRequestException("Invalid credentials!");

    return {
      message: "Login successful!",
      user: result.user,
      token: result.token
    };
  }
}
