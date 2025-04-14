import {
  UniqueConstraintError,
  DatabaseError,
  ValidationError,
  AggregateError,
  AssociationError,
  BulkRecordError,
  ConnectionError,
  EagerLoadingError,
  EmptyResultError,
  InstanceError,
  OptimisticLockError,
  QueryError,
  SequelizeScopeError,
} from 'sequelize';

/**
 * Utility class to handle Sequelize errors
 */
export class SequelizeErrorUtil {
  /**
   * Formats a Sequelize error based on its type
   * @param error - The error thrown by Sequelize
   * @returns A user-friendly error message
   */
  static formatSequelizeError(error: Error): string {
    if (error instanceof UniqueConstraintError) {
      return `${this.extractErrorMessage(error)}`;
    } else if (error instanceof DatabaseError) {
      return `${this.extractErrorMessage(error)}`;
    } else if (error instanceof ValidationError) {
      return `${this.extractErrorMessage(error)}`;
    } else if (error instanceof AggregateError) {
      return `${this.extractErrorMessage(error)}`;
    } else if (error instanceof AssociationError) {
      return `${this.extractErrorMessage(error)}`;
    } else if (error instanceof BulkRecordError) {
      return `${this.extractErrorMessage(error)}`;
    } else if (error instanceof ConnectionError) {
      return `${this.extractErrorMessage(error)}`;
    } else if (error instanceof EagerLoadingError) {
      return `${this.extractErrorMessage(error)}`;
    } else if (error instanceof EmptyResultError) {
      return `${this.extractErrorMessage(error)}`;
    } else if (error instanceof InstanceError) {
      return `${this.extractErrorMessage(error)}`;
    } else if (error instanceof OptimisticLockError) {
      return `${this.extractErrorMessage(error)}`;
    } else if (error instanceof QueryError) {
      return `${this.extractErrorMessage(error)}`;
    } else if (error instanceof SequelizeScopeError) {
      return `${this.extractErrorMessage(error)}`;
    } else {
      return `${this.extractErrorMessage(error)}`;
    }
  }

  /**
   * Extracts a simplified error message from the Sequelize error object
   * @param error - The Sequelize error instance
   * @returns The error message
   */
  private static extractErrorMessage(error: Error): string {
    return error.message || 'An error occurred';
  }
}
