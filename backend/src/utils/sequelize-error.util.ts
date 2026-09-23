import { HttpException, HttpStatus } from '@nestjs/common';
import {
  ConnectionError,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize';
import { loggerUtil } from 'src/shared/utils/log.util';

/**
 * Utility class to handle Sequelize errors.
 *
 * Exported signature is unchanged, but note the behaviour callers rely on:
 *  - an HttpException passed in is re-thrown untouched, so its own status
 *    code survives (401s from the JWT filters stay 401 instead of being
 *    flattened to the caller's hardcoded 400);
 *  - unknown / infrastructure DB errors throw 500 (503 for connection
 *    failures) instead of returning raw MySQL text;
 *  - known constraint violations return a generic client-safe message.
 * Full driver details are logged server-side only — never leak column
 * names, duplicate-entry values (emails) or 'Data too long' text to clients.
 */
export class SequelizeErrorUtil {
  /**
   * Formats a Sequelize error based on its type
   * @param error - The error thrown by Sequelize
   * @returns A user-safe error message
   */
  static formatSequelizeError(error: Error): string {
    if (error instanceof HttpException) {
      throw error;
    }

    loggerUtil.error(
      `Sequelize error: ${error?.message}`,
      (error as any)?.stack,
      'SequelizeErrorUtil',
    );

    const driverCode =
      (error as any)?.parent?.code ?? (error as any)?.original?.code;

    if (
      error instanceof UniqueConstraintError ||
      driverCode === 'ER_DUP_ENTRY'
    ) {
      return 'A record with the same details already exists';
    }
    if (
      driverCode === 'ER_DATA_TOO_LONG' ||
      driverCode === 'ER_TRUNCATED_WRONG_VALUE' ||
      driverCode === 'ER_INVALID_NUMBER_FORMAT' ||
      driverCode === 'ER_NO_REFERENCED_ROW_2'
    ) {
      return 'One or more provided values are invalid';
    }
    if (error instanceof ValidationError) {
      return 'The provided data failed validation';
    }
    if (error instanceof ConnectionError) {
      throw new HttpException(
        'Database unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // Default: opaque 500 — details live in the server log, not the response.
    throw new HttpException(
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
