import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';

/** Header the public website (Meca-UI) sends when it forwards a visitor's form to this API. */
export const SITE_KEY_HEADER = 'x-site-key';

const matches = (given: string, expected: string) => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * Rate limiting by IP, except for requests from our own website server.
 *
 * Meca-UI forwards contact, newsletter, review and preview forms from its server, so every
 * visitor would share the website's IP and one busy minute could block everyone. The website
 * rate-limits each visitor itself and proves who it is with SITE_REVALIDATE_SECRET (the same
 * shared secret it already uses for cache refreshes). Requests without it are limited as usual.
 */
@Injectable()
export class SiteThrottlerGuard extends ThrottlerGuard {
  protected override async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (await super.shouldSkip(context)) return true;
    const secret = process.env.SITE_REVALIDATE_SECRET;
    if (!secret || context.getType() !== 'http') return false;
    const given = context.switchToHttp().getRequest<Request>().headers[SITE_KEY_HEADER];
    return typeof given === 'string' && matches(given, secret);
  }
}
