import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';

/** Website cache tags fed by each controller (its @Controller path). */
const TAGS_BY_CONTROLLER: Record<string, string[]> = {
  blogs: ['blogs'],
  project: ['projects'],
  work: ['projects'],
  // Client companies give projects their industry, and power the logo strip
  clients: ['clients', 'projects'],
  review: ['reviews'],
  banner: ['banners'],
  // Founders and team (About page)
  team: ['team'],
  // Contact details, social links, addresses and hours (header, footer, contact page)
  settings: ['contact'],
};

/**
 * After an admin creates, edits or deletes website content, tells the public website
 * (Meca-UI, POST SITE_REVALIDATE_URL) which cached content to refresh, so changes show
 * within seconds. Fire-and-forget: a failed ping never fails the request, and the site
 * also re-checks the API every minute. Public routes (e.g. a visitor's review) are skipped.
 */
@Injectable()
export class SiteRevalidateInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SiteRevalidateInterceptor.name);

  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    if (context.getType() !== 'http' || ['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next.handle();

    const controllerPath = String(this.reflector.get<string>(PATH_METADATA, context.getClass()) ?? '').replace(/^\/+/, '');
    const tags = TAGS_BY_CONTROLLER[controllerPath];
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (!tags || isPublic) return next.handle();

    return next.handle().pipe(tap(() => void this.notify(tags)));
  }

  private async notify(tags: string[]) {
    const url = this.config.get<string>('SITE_REVALIDATE_URL');
    const secret = this.config.get<string>('SITE_REVALIDATE_SECRET');
    if (!url || !secret) return;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-revalidate-secret': secret },
        body: JSON.stringify({ tags }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) this.logger.warn(`Website revalidation responded ${res.status} for [${tags.join(', ')}]`);
    } catch (error) {
      this.logger.warn(`Website revalidation failed for [${tags.join(', ')}]: ${(error as Error).message}`);
    }
  }
}
