import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { loggerUtil } from '../utils/log.util';

@Catch(UnauthorizedException)
export class JwtExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Check if it's a JWT-related exception
    const exceptionResponse = exception.getResponse() as any;
    const message = exceptionResponse.message;
    const isTokenExpired = typeof message === 'string' && 
      (message.includes('expired') || message.includes('jwt expired'));

    // Log the exception
    loggerUtil.warn('JWT exception filter caught exception', {
      path: request.url,
      isTokenExpired,
      message,
    });

    // Respond with a specific message for token expiration
    if (isTokenExpired) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: 'Access token has expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    // Default unauthorized response
    return response.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: 'Unauthorized',
      code: 'UNAUTHORIZED',
    });
  }
} 