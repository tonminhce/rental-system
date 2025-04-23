import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_RENTAL_KEY } from '../decorators/is-rental.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // First check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    
    // Get required roles from the Roles decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // Get required roles from the IsRental decorator
    const isRentalRoles = this.reflector.getAllAndOverride<string[]>(IS_RENTAL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // Combine the roles from both decorators
    const combinedRoles = [...(requiredRoles || []), ...(isRentalRoles || [])];
    
    // If no roles are required at all, allow access
    if (!combinedRoles.length) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    // If no user is available (not authenticated), deny access
    if (!user) {
      throw new ForbiddenException('Access denied: User not authenticated');
    }
    
    // Check if user has at least one of the required roles
    const hasRole = combinedRoles.some((role) => user.role === role);
    
    if (!hasRole) {
      throw new ForbiddenException(`Access denied: Role '${user.role}' is not authorized for this operation`);
    }
    
    return true;
  }
} 