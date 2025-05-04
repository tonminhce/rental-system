import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { loggerUtil } from 'src/shared/utils/log.util'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // For public routes, allow the request to proceed but don't throw on missing token
      this.tryAuthentication(context);
      return true;
    }

    return super.canActivate(context);
  }

  // For public routes - try to authenticate but don't fail if no token
  private tryAuthentication(context: ExecutionContext): void {
    try {
      super.getRequest(context);
    } catch (error) {
      // Suppress authentication errors for public routes
      loggerUtil.info('Public route with invalid or missing token: proceeding without authentication');
    }
  }

  handleRequest(err, user, info, context) {
    const isPublic = context && this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If it's a public route, don't throw an error for missing user
    if (isPublic) {
      return user;
    }
    
    if (err || !user) {
      if (!user) {
        loggerUtil.warn('UnauthorizedException: No authenticated user found');
      }
      throw err || new UnauthorizedException();
    }

    return user;
  }
}
