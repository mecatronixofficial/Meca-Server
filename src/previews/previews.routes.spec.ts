import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { CreateSitePreviewDto } from './dto/site-preview.dto';
import { SitePreview } from './entities/site-preview.entity';
import { MailService } from '../mail/mail.service';
import { StorageService } from '../storage/storage.service';
import { ENTITIES } from '../database/entities';

describe('website preview routes in AppModule', () => {
  let app: NestExpressApplication;
  let base: string;
  const previewId = 'd20672b2-9c03-4c77-bd3c-cfb9256badf8';
  const repository = {
    create: jest.fn((value: CreateSitePreviewDto) => value),
    save: jest.fn((value: object) => Promise.resolve({ ...value, id: previewId })),
  };

  beforeAll(async () => {
    // Isolated test configuration: no real database, storage or email calls.
    Object.assign(process.env, {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/preview_route_test',
      JWT_SECRET: 'test-preview-routes-secret-at-least-32-characters',
      R2_ACCOUNT_ID: 'test', R2_ACCESS_KEY_ID: 'test', R2_SECRET_ACCESS_KEY: 'test',
      R2_BUCKET: 'test', R2_PUBLIC_URL: 'https://media.example.com',
      DB_SSL: 'false', DB_SYNCHRONIZE: 'false', SWAGGER_ENABLED: 'false', ADMIN_EMAIL: '',
    });
    const { AppModule } = await import('../app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DataSource).useValue({
        options: { type: 'postgres' }, entityMetadatas: [], manager: {}, isInitialized: false,
        getRepository: (entity: unknown) => entity === SitePreview ? repository : {},
      })
      .overrideProvider(MailService).useValue({ trySend: jest.fn() })
      .overrideProvider(StorageService).useValue({ upload: jest.fn() })
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('mec-api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
  });

  afterAll(async () => { await app?.close(); });
  beforeEach(() => { jest.clearAllMocks(); });

  it('registers preview persistence in the app and migration entity registry', () => {
    expect(ENTITIES).toContain(SitePreview);
  });

  it('accepts a public multipart submission at the website URL and returns its preview id', async () => {
    const body = new FormData();
    for (const [key, value] of Object.entries({
      company_name: 'Preview route test', industry: 'medical', brand_color: '#e10600',
      contact_name: 'Test Visitor', email: 'visitor@example.com', services: '["Consultation"]',
    })) body.append(key, value);
    const response = await fetch(base + '/mec-api/previews/add', { method: 'POST', body });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ success: true, data: { id: previewId } });
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      company_name: 'Preview route test', services: ['Consultation'], logo_url: null,
    }));
  });

  it('validates incomplete submissions instead of returning a missing-route error', async () => {
    const response = await fetch(base + '/mec-api/previews/add', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    expect(response.status).toBe(400);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('keeps the preview lead list protected', async () => {
    const response = await fetch(base + '/mec-api/previews/getall');
    expect(response.status).toBe(401);
  });
});
