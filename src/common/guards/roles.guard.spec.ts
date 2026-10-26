import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '../../admins/entities/admin.entity';
import { RolesGuard } from './roles.guard';

const contextFor = (role?: AdminRole) =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { id: '1', email: 'a@b.c', role } : undefined }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  it('allows routes without role metadata', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(undefined);
    expect(guard.canActivate(contextFor(AdminRole.ADMIN))).toBe(true);
  });

  it('allows a superadmin on a superadmin route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce([AdminRole.SUPERADMIN]);
    expect(guard.canActivate(contextFor(AdminRole.SUPERADMIN))).toBe(true);
  });

  it('rejects a regular admin on a superadmin route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce([AdminRole.SUPERADMIN]);
    expect(() => guard.canActivate(contextFor(AdminRole.ADMIN))).toThrow(ForbiddenException);
  });
});
