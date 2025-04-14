import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {JwtService} from "@nestjs/jwt";
import {ConfigService} from "@nestjs/config";
import { RequestContext } from 'src/common/request-context';
import { loggerUtil } from 'src/utils/log.util';

@Injectable()
export class SetLoginUserGloballyMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService, readonly configService: ConfigService) {}
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return next();
    }
    try {
      const user = this.jwtService.verify(token, { secret: this.configService.get<string>('TOKEN_SECRET') });
      loggerUtil.info(
        `SetLoginUserGloballyMiddleware verified jwt user: ${JSON.stringify(user)}`,
      );
      const store = {
        user: user,
      };
      // Store user in AsyncLocalStorage
      RequestContext.run(store, () => next());
    } catch (error) {
      loggerUtil.error(error)
      next();
    }
  }
}
