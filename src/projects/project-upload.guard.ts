import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { Admin } from '../admins/entities/admin.entity';

export function uploadTicket(payload: string, secret: string): string {
  return createHmac('sha256', secret).update('project-upload:' + payload).digest('base64url');
}

@Injectable()
export class ProjectUploadGuard implements CanActivate {
  constructor(private readonly config: ConfigService, private readonly db: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const [scheme, ticket] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Upload' || !ticket || ticket.length > 1000) throw new UnauthorizedException('Upload permission required.');
    const [payload, signature, extra] = ticket.split('.');
    if (!payload || !signature || extra) throw new UnauthorizedException('Invalid upload permission.');
    const expected = Buffer.from(uploadTicket(payload, this.config.getOrThrow<string>('JWT_SECRET')));
    const supplied = Buffer.from(signature);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw new UnauthorizedException('Invalid upload permission.');
    let claims: { id: string; expires: number };
    try { claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); }
    catch { throw new UnauthorizedException('Invalid upload permission.'); }
    if (typeof claims.expires !== 'number' || claims.expires < Date.now() || typeof claims.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(claims.id) || !(await this.db.getRepository(Admin).existsBy({ id: claims.id }))) {
      throw new UnauthorizedException('Upload permission expired. Please try again.');
    }
    return true;
  }
}

