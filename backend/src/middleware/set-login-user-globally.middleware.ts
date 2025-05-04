import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {JwtService} from "@nestjs/jwt";
import {ConfigService} from "@nestjs/config";
import { RequestContext } from 'src/common/request-context';
import { loggerUtil } from 'src/shared/utils/log.util'

@Injectable()
export class SetLoginUserGloballyMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService, readonly configService: ConfigService) {}
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['authorization']?.split(' ')[1];

    // Create a store with user information if available
    const store = {};

    if (token) {
      try {
        const user = this.jwtService.verify(token, { secret: this.configService.get<string>('TOKEN_SECRET') });
        loggerUtil.info(
          `SetLoginUserGloballyMiddleware verified jwt user: ${JSON.stringify(user)}`,
        );

        // Add user to the store
        store['user'] = user;
      } catch (error) {
        loggerUtil.error(`JWT verification error: ${error.message}`);
        // Don't throw error for invalid tokens, just continue without user
      }
    }

    // Always run in RequestContext, even for public routes without a token
    RequestContext.run(store, () => next());
  }
}
