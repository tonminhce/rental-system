import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { loggerUtil } from 'src/utils/log.util';
import { responseUtil } from 'src/utils/response.util';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const { message, stack } = exception;
    const optionalError = [stack, 'HttpExceptionFilter'];
    loggerUtil.error(message ?? 'Error', ...optionalError);
    const objectResult = responseUtil.error(
      status,
      message,
      exception.getResponse(),
    );
    response.status(status).json(objectResult);
  }
}
