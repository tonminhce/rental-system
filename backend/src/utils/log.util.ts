import { LoggerService } from '@nestjs/common';
import logger from '../config/logger.config';
export class Logger implements LoggerService {
  protected options: {
    timestamp: false;
  };

  private readonly appName = process.env['APP_NAME'] || 'app_name';
  private readonly env = process.env['NODE_ENV'] || 'production';
  /**
   * Write a 'log' level log.
   */
  log(message: any, ...optionalParams: any[]): void {
    logger.log({
      service: this.appName,
      timestamp: '',
      level: 'info',
      env: this.env,
      type: optionalParams,
      message: message,
    });
  }
  info(message: any, ...optionalParams: any[]): void {
    logger.info({
      service: this.appName,
      timestamp: '',
      level: 'info',
      env: this.env,
      type: optionalParams,
      message: message,
    });
  }

  /**
   * Write an 'error' level log.
   */
  error(message: any, ...optionalParams: any[]) {
    logger.error({
      service: this.appName,
      timestamp: '',
      level: 'error',
      env: this.env,
      type: `[${optionalParams[1]}]`,
      message: message,
      details: optionalParams,
    });
  }

  /**
   * Write a 'warn' level log.
   */
  warn(message: any, ...optionalParams: any[]) {
    logger.log({
      service: this.appName,
      timestamp: '',
      level: 'warn',
      env: this.env,
      message: message,
      type: optionalParams,
    });
  }

  /**
   * Write a 'debug' level log.
   */
  debug?(message: any, ...optionalParams: any[]) {
    logger.debug({
      service: this.appName,
      timestamp: '',
      level: 'debug',
      env: this.env,
      message: message,
      type: optionalParams,
    });
  }

  /**
   * Write a 'verbose' level log.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verbose?(message: any, ...optionalParams: any[]) {}
}
export const loggerUtil = new Logger();
