import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { Roles, Role } from './roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { JwtAuthGuard } from '../guards/jwt.guard';

/**
 * Decorator that ensures only users with the 'rental' role can access the endpoint
 */
export function RentalOnly() {
  return applyDecorators(
    Roles(Role.RENTAL),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or expired token' }),
    ApiForbiddenResponse({ description: 'Forbidden - User does not have the rental role' }),
  );
} 