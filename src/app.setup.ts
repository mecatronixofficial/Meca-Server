import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModulesContainer } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { readFileSync } from 'fs';
import helmet from 'helmet';
import path from 'path';
import { IS_PUBLIC_KEY } from './common/decorators/auth.decorators';
import { AUTH_COOKIE } from './common/guards/jwt-auth.guard';
import { MailService } from './mail/mail.service';

export const API_PREFIX = 'mec-api';
export const DOCS_PATH = `${API_PREFIX}/docs`;
export const APP_VERSION: string = (() => {
  try {
    return JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
})();

/** Swagger is on by default outside production; set SWAGGER_ENABLED=true/false to override. */
export const docsEnabled = (config: ConfigService) => {
  const flag = config.get<string>('SWAGGER_ENABLED');
  return flag === undefined || flag === '' ? config.get('NODE_ENV') !== 'production' : flag === 'true';
};

/** Applies middleware, validation, views and API docs. Shared by main.ts and the e2e tests. */
export function configureApp(app: NestExpressApplication): NestExpressApplication {
  const config = app.get(ConfigService);
  const origins = [config.get<string>('LOCAL_URL'), config.get<string>('CLIENT_URL'), config.get<string>('ADMIN_URL')].filter(
    (origin): origin is string => !!origin,
  );

  // Behind a reverse proxy (Render, Nginx, Cloudflare) so rate limiting sees the real client IP.
  app.set('trust proxy', 1);
  app.setGlobalPrefix(API_PREFIX, { exclude: ['/', 'health'] });
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.use(cookieParser());
  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { limit: '1mb', extended: true });
  app.enableCors({ origin: origins, credentials: true });
  // Unknown fields are stripped rather than rejected, so clients can send back whole records (id, createdAt…) on edit.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));

  // Server-rendered pages (home, unsubscribe, password reset) share the email brand values.
  app.setBaseViewsDir(path.join(process.cwd(), 'views'));
  app.setViewEngine('ejs');
  app.setLocal('brand', app.get(MailService).brand());

  if (docsEnabled(config)) setupDocs(app);
  return app;
}

/**
 * Adds the cookie/bearer requirement to every operation that is not @Public(), so Swagger shows
 * a lock exactly where the global JwtAuthGuard applies. Operation ids default to `Controller_method`.
 */
function markProtectedOperations(app: NestExpressApplication, document: OpenAPIObject) {
  const publicOperations = new Set<string>();
  for (const module of app.get(ModulesContainer).values()) {
    for (const wrapper of module.controllers.values()) {
      const controller = wrapper.metatype as (new (...args: never[]) => unknown) | null;
      if (!controller?.prototype) continue;
      const classIsPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller) === true;
      for (const method of Object.getOwnPropertyNames(controller.prototype)) {
        const handler = (controller.prototype as Record<string, unknown>)[method];
        if (typeof handler === 'function' && (classIsPublic || Reflect.getMetadata(IS_PUBLIC_KEY, handler) === true)) {
          publicOperations.add(`${controller.name}_${method}`);
        }
      }
    }
  }
  for (const pathItem of Object.values(document.paths)) {
    for (const operation of Object.values(pathItem) as Array<{ operationId?: string; security?: unknown[] }>) {
      if (operation?.operationId && !publicOperations.has(operation.operationId)) operation.security = [{ [AUTH_COOKIE]: [] }, { bearer: [] }];
    }
  }
}

function setupDocs(app: NestExpressApplication) {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Mecatronix API')
      .setDescription(
        'REST API for the Mecatronix website and admin panel.\n\n' +
          '**Authentication:** call `POST /mec-api/auth/login` here first. It sets the httpOnly `admin_token` cookie, ' +
          'which this page then sends automatically. Routes without a lock icon are public.\n\n' +
          '**Responses** use `{ success, message, data }`. **Lists** return an array, or `{ items, meta }` when `page` or `limit` is passed.',
      )
      .setVersion(APP_VERSION)
      .addCookieAuth(AUTH_COOKIE, { type: 'apiKey', in: 'cookie', name: AUTH_COOKIE })
      .addBearerAuth()
      .build(),
  );
  markProtectedOperations(app, document);
  SwaggerModule.setup(DOCS_PATH, app, document, {
    customSiteTitle: 'Mecatronix API docs',
    jsonDocumentUrl: `${DOCS_PATH}/openapi.json`,
    swaggerOptions: { persistAuthorization: true, withCredentials: true, docExpansion: 'none', tagsSorter: 'alpha', operationsSorter: 'alpha' },
  });
}
