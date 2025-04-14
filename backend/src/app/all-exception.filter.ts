import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { loggerUtil } from 'src/utils/log.util';
import { responseUtil } from 'src/utils/response.util';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const { message, stack }: any = exception;
    const optionalError = [stack, 'AllExceptionFilter'];
    const objectResult = responseUtil.error(
      HttpStatus.BAD_REQUEST,
      message ?? 'Internal Server Error',
      {},
    );
    loggerUtil.error(message ?? 'Error', ...optionalError);

    response.status(HttpStatus.BAD_REQUEST).json(objectResult);
  }
}
