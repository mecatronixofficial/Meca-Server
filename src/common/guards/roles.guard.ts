import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminRole } from '../../admins/entities/admin.entity';
import { ROLES_KEY } from '../decorators/auth.decorators';
import { AuthRequest } from './jwt-auth.guard';

/** Global guard: enforces @Roles(...). Runs after JwtAuthGuard, so `request.user` is set on protected routes. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AdminRole[] | undefined>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles?.length) return true;

    const { user } = context.switchToHttp().getRequest<AuthRequest>();
    if (!user || !roles.includes(user.role)) throw new ForbiddenException('You do not have permission to perform this action.');
    return true;
  }
}
