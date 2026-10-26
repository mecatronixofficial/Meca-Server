import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { Admin, AdminRole } from '../../admins/entities/admin.entity';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';

export const AUTH_COOKIE = 'admin_token';

export interface AuthUser {
  id: string;
  email: string;
  role: AdminRole;
}

export interface AuthRequest extends Request {
  user: AuthUser;
}

/**
 * Global guard: every route requires a valid JWT (cookie or Bearer header) unless marked @Public().
 * The account is re-read on each request, so deleting an admin or changing a role takes effect
 * immediately instead of when the token expires.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly db: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const header = request.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const token = (request.cookies?.[AUTH_COOKIE] as string | undefined) ?? bearer;
    if (!token) throw new UnauthorizedException('Access denied. Token required.');

    let payload: AuthUser;
    try {
      payload = await this.jwt.verifyAsync<AuthUser>(token);
    } catch (error) {
      const expired = (error as Error)?.name === 'TokenExpiredError';
      throw new UnauthorizedException(expired ? 'Session expired. Please log in again.' : 'Invalid authentication token.');
    }

    const admin = await this.db.getRepository(Admin).findOne({ where: { id: payload.id }, select: { id: true, email: true, role: true } });
    if (!admin) throw new UnauthorizedException('Account no longer exists. Please log in again.');
    request.user = { id: admin.id, email: admin.email, role: admin.role };
    return true;
  }
}
