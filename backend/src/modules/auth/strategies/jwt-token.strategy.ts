import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/database/entities/user.entity';
import { loggerUtil } from 'src/shared/utils/log.util';

const _strategyName = 'JwtStrategy';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User)
    private userModel: typeof User,
  ) {
    const tokenSecret = configService.get<string>('TOKEN_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: tokenSecret,
      ignoreExpiration: false,
    });
  }

  async validate(payload): Promise<any> {
    loggerUtil.info(`${_strategyName}.validate begin with payload: ${JSON.stringify(payload)}`);

    try {
      const user = await this.userModel.findByPk(payload.id, {
        include: ['role'],
      });

      if (!user) {
        loggerUtil.warn(`${_strategyName}.validate user not found with id: ${payload.id}`);
        throw new UnauthorizedException();
      }

      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role ? user.role.name : null,
      };

      loggerUtil.info(`${_strategyName}.validate successful for user: ${user.email}`);
      return userData;
    } catch (error) {
      loggerUtil.error(`${_strategyName}.validate error: ${error.message}`, error);
      throw error;
    }
  }
}
