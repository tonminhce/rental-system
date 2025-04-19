import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import * as ms from 'ms';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { loggerUtil } from '../../shared/utils/log.util';
import { encodeToMD5 } from '../../shared/utils/md5.util';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { SequelizeErrorUtil } from 'src/utils/sequelize-error.util';

const _serviceName = 'AuthService';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Role)
    private roleModel: typeof Role,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private users: User[] = [];
  private id_number: number = 1;

  async signup(signupDto: SignupDto): Promise<{ user: any; token: string }> {
    loggerUtil.info(
      `${_serviceName}.signup begin with email: ${signupDto.email}`,
    );

    try {
      
      const role = await this.roleModel.findOne({
        where: { name: signupDto.role },
      });

      const hashedPassword = encodeToMD5(signupDto.password);

      const user = await this.userModel.create({
        name: signupDto.name,
        email: signupDto.email,
        password: hashedPassword,
        phone: signupDto.phone,
        roleId: role.id,
      });

      loggerUtil.info(
        `${_serviceName}.signup user created with id: ${user.id}`,
      );

      const payload = {
        id: user.id,
        email: user.email,
        role: role.name,
      };

      const tokenSecret = this.configService.get('TOKEN_SECRET');
      const tokenExpiration =
        this.configService.get('TOKEN_EXPIRATION') || '1d';

      const token = this.jwtService.sign(payload, {
        secret: tokenSecret,
        expiresIn: +ms(tokenExpiration) / 1000,
      });

      loggerUtil.info(`${_serviceName}.signup successful with token generated`);

      const userData = {
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: role.name,
      };

      return { user: userData, token };
    } catch (error) {
      loggerUtil.error(`${_serviceName}.signup error: ${error.message}`, error);
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<{ user: any; token: string }> {
    loggerUtil.info(
      `${_serviceName}.login begin with email: ${loginDto.email}`,
    );

    try {
      const user = await this.userModel.findOne({
        where: { email: loginDto.email },
        include: ['role'],
      });

      const hashedPassword = encodeToMD5(loginDto.password);
      if (hashedPassword !== user.password) {
        loggerUtil.warn(
          `${_serviceName}.login invalid password for user: ${loginDto.email}`,
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = {
        id: user.id,
        email: user.email,
        role: user.role ? user.role.name : null,
      };

      const tokenSecret = this.configService.get('TOKEN_SECRET');
      const tokenExpiration =
        this.configService.get('TOKEN_EXPIRATION') || '1d';

      loggerUtil.info(
        `${_serviceName}.login jwtService.sign with payload: ${JSON.stringify(payload)}`,
      );

      const token = this.jwtService.sign(payload, {
        secret: tokenSecret,
        expiresIn: +ms(tokenExpiration) / 1000,
      });

      loggerUtil.info(
        `${_serviceName}.login successful for user: ${user.email}`,
      );

      const userData = {
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role ? user.role.name : null,
      };

      return { user: userData, token };
    } catch (error) {
      loggerUtil.error(`${_serviceName}.login error: ${error.message}`, error);
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }
}
