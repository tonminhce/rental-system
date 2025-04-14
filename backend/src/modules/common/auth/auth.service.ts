import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
// const _serviceName: string = 'AuthService';
@Injectable()
export class AuthService {
  constructor(
    readonly configService: ConfigService,
    readonly jwtService: JwtService,
  ) {}
}
