import { SetMetadata } from '@nestjs/common';
import { Role } from './roles.decorator';

/**
 * Decorator that marks a route handler as requiring the rental role
 * This is a metadata-only decorator that doesn't apply guards
 */
export const IS_RENTAL_KEY = 'isRental';
export const IsRental = () => SetMetadata(IS_RENTAL_KEY, [Role.RENTAL]); 