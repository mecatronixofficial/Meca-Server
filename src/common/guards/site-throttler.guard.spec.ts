import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SITE_KEY_HEADER, SiteThrottlerGuard } from './site-throttler.guard';

describe('SiteThrottlerGuard', () => {
  const guard = new SiteThrottlerGuard([], {} as never, new Reflector());
  const shouldSkip = (headers: Record<string, string>) =>
    (guard as unknown as { shouldSkip(c: ExecutionContext): Promise<boolean> }).shouldSkip({
      getType: () => 'http',
      getHandler: () => () => undefined,
      getClass: () => class {},
      switchToHttp: () => ({ getRequest: () => ({ headers }) }),
    } as unknown as ExecutionContext);

  const original = process.env.SITE_REVALIDATE_SECRET;
  afterEach(() => (process.env.SITE_REVALIDATE_SECRET = original));

  it('skips rate limiting for the website server with the shared secret', async () => {
    process.env.SITE_REVALIDATE_SECRET = 'shared-secret';
    await expect(shouldSkip({ [SITE_KEY_HEADER]: 'shared-secret' })).resolves.toBe(true);
  });

  it('limits everyone else', async () => {
    process.env.SITE_REVALIDATE_SECRET = 'shared-secret';
    await expect(shouldSkip({})).resolves.toBe(false);
    await expect(shouldSkip({ [SITE_KEY_HEADER]: 'wrong' })).resolves.toBe(false);
  });

  it('never skips when no secret is configured', async () => {
    delete process.env.SITE_REVALIDATE_SECRET;
    await expect(shouldSkip({ [SITE_KEY_HEADER]: '' })).resolves.toBe(false);
  });
});
