import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { responseUtil } from '../../shared/utils/response.util';
import { Public } from '../../shared/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @Post('signup')
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({ status: 201, description: 'User signed up successfully' })
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
  @ApiOperation({ summary: 'Login an existing user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);

    return responseUtil.success({
      message: 'Login successful!',
      user: result.user,
      token: result.token,
    });
  }
}