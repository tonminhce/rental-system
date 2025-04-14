import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(readonly configService: ConfigService) {
    const tokenSecret = configService.get<string>('TOKEN_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: tokenSecret,
      ignoreExpiration: false,
    });
  }
  // When the token is valid, the validate method will be called (Success)
  async validate(payload): Promise<any> {
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
    };
  }
}
