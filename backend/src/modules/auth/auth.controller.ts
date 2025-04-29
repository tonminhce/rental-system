import { Body, Controller, HttpCode, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { responseUtil } from '../../shared/utils/response.util';
import { Public } from '../../shared/decorators/public.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    const result = await this.authService.signup(signupDto);

    return responseUtil.success({
      message: 'Sign up successful!',
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken
    });
  }

  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Authenticate a user and return a token' })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);

    return responseUtil.success({
      message: 'Login successful!',
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken
    });
  }

  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(refreshTokenDto);

    return responseUtil.success({
      message: 'Token refreshed successfully!',
      token: result.token,
      refreshToken: result.refreshToken
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout user and revoke refresh token' })
  @Post('logout')
  async logout(@Request() req, @Body() body: { refreshToken?: string }) {
    const userId = req.user.id;
    const refreshToken = body.refreshToken;
    
    await this.authService.logout(userId, refreshToken);
    
    return responseUtil.success({
      message: 'Logout successful!'
    });
  }
}
