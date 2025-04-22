import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { responseUtil } from '../../shared/utils/response.util';
import { Public } from '../../decorator/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    const result = await this.authService.signup(signupDto);

    return responseUtil.success({
      message: 'Sign up successful!',
      user: result.user,
      token: result.token,
    });
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);

    return responseUtil.success({
      message: 'Login successful!',
      user: result.user,
      token: result.token,
    });
  }
}
