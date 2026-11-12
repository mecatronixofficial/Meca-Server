import { CallHandler, Controller, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { Public } from '../decorators/auth.decorators';
import { SiteRevalidateInterceptor } from './site-revalidate.interceptor';

@Controller('blogs')
class BlogsStub {
  save() {}
  @Public()
  list() {}
}

@Controller('invoice')
class InvoiceStub {
  save() {}
}

const context = (method: string, controller: new () => object, handler: string) =>
  ({
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => ({ method }) }),
    getClass: () => controller,
    getHandler: () => Object.getOwnPropertyDescriptor(controller.prototype, handler)?.value,
  }) as unknown as ExecutionContext;

const handler: CallHandler = { handle: () => of({ success: true }) };

describe('SiteRevalidateInterceptor', () => {
  const fetchMock = jest.fn();
  const env: Record<string, string> = { SITE_REVALIDATE_URL: 'https://site.test/api/revalidate', SITE_REVALIDATE_SECRET: 'secret' };
  const interceptor = new SiteRevalidateInterceptor({ get: (key: string) => env[key] } as unknown as ConfigService, new Reflector());

  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
  });

  const run = async (ctx: ExecutionContext) => {
    await lastValueFrom(interceptor.intercept(ctx, handler));
    await new Promise((resolve) => setImmediate(resolve));
  };

  it('pings the website with the content tags after an admin write', async () => {
    await run(context('POST', BlogsStub, 'save'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string>; body: string }];
    expect(url).toBe('https://site.test/api/revalidate');
    expect(init.headers).toMatchObject({ 'x-revalidate-secret': 'secret' });
    expect(JSON.parse(init.body)).toEqual({ tags: ['blogs'] });
  });

  it('ignores reads, public routes and content the website does not show', async () => {
    await run(context('GET', BlogsStub, 'save'));
    await run(context('POST', BlogsStub, 'list'));
    await run(context('PUT', InvoiceStub, 'save'));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never fails the request when the website is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    await expect(run(context('DELETE', BlogsStub, 'save'))).resolves.toBeUndefined();
  });
});
