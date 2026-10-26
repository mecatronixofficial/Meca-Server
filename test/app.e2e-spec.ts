/**
 * End-to-end tests against a real PostgreSQL database.
 *
 *   TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/mecatronix_test npm run test:e2e
 *
 * The suite runs migrations on that database and creates uniquely named records, so it can be re-run
 * without cleanup. It never touches DATABASE_URL and is skipped when TEST_DATABASE_URL is not set.
 */
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import type { App } from 'supertest/types';

const TEST_DB = process.env.TEST_DATABASE_URL;
const describeIfDb = TEST_DB ? describe : describe.skip;

describeIfDb('Mecatronix API (e2e)', () => {
  const run = randomUUID().slice(0, 8);
  const owner = { email: `owner-${run}@example.com`, password: 'Owner-Passw0rd!' };
  let app: NestExpressApplication;
  let server: App;
  let ownerAgent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    if (TEST_DB === process.env.DATABASE_URL) throw new Error('TEST_DATABASE_URL must differ from DATABASE_URL');
    Object.assign(process.env, {
      DATABASE_URL: TEST_DB,
      DB_SSL: process.env.TEST_DB_SSL ?? 'false',
      DB_SYNCHRONIZE: 'false',
      RESEND_API_KEY: '',
      SWAGGER_ENABLED: 'true',
      NODE_ENV: 'test',
    });

    // Imported after the environment is set, because config and the data source read it on load.
    const { default: dataSource } = await import('../src/database/data-source');
    const { Admin } = await import('../src/admins/entities/admin.entity');
    const { seedSuperadmin } = await import('../src/database/seeds/superadmin.seed');
    await dataSource.initialize();
    await dataSource.runMigrations();
    await seedSuperadmin(dataSource.getRepository(Admin), { name: 'E2E Owner', phone: '9999999999', saltRounds: 4, ...owner });
    await dataSource.destroy();

    const { AppModule } = await import('../src/app.module');
    const { configureApp } = await import('../src/app.setup');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();
    server = app.getHttpServer();

    ownerAgent = request.agent(server);
    await ownerAgent.post('/mec-api/auth/login').send(owner).expect(200);
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('health and pages', () => {
    it('returns JSON health to API clients', async () => {
      const res = await request(server).get('/').set('Accept', 'application/json').expect(200);
      expect(res.body.data).toMatchObject({ status: 'ok', database: 'up' });
    });

    it('serves the HTML home page to browsers', async () => {
      const res = await request(server).get('/').set('Accept', 'text/html').expect(200);
      expect(res.text).toContain('MECATRONIX API');
    });

    it('serves Swagger docs and the OpenAPI document', async () => {
      await request(server).get('/mec-api/docs').expect(200);
      const spec = await request(server).get('/mec-api/docs/openapi.json').expect(200);
      expect(spec.body.paths['/mec-api/blogs/all'].get.security).toBeDefined();
      expect(spec.body.paths['/mec-api/banner/get'].get.security).toBeUndefined();
    });

    it('shows an error page for an invalid unsubscribe link', async () => {
      const res = await request(server).get('/mec-api/news/unsubscribe?email=a@b.co&token=forged').expect(400);
      expect(res.text).toContain('not valid');
    });

    it('shows an expired page for an unknown reset token', async () => {
      const res = await request(server).get('/mec-api/auth/reset-password/not-a-real-token').expect(400);
      expect(res.text).toContain('expired');
    });
  });

  describe('auth and roles', () => {
    it('rejects protected routes without a session', () => request(server).get('/mec-api/dash/all').expect(401));

    it('rejects a wrong password', () =>
      request(server).post('/mec-api/auth/login').send({ email: owner.email, password: 'wrong-password' }).expect(401));

    it('lets a superadmin create an admin who cannot manage admins', async () => {
      const staff = { name: 'Staff', email: `staff-${run}@example.com`, phone: '9000000001', password: 'staff-pass-1' };
      await ownerAgent.post('/mec-api/admin/add_admin').send(staff).expect(201);

      const staffAgent = request.agent(server);
      await staffAgent.post('/mec-api/auth/login').send({ email: staff.email, password: staff.password }).expect(200);
      await staffAgent.get('/mec-api/admin/get_all_admins').expect(403);
      await staffAgent.get('/mec-api/dash/all').expect(200);
    });
  });

  describe('content and pagination', () => {
    it('creates a client, work and project, and lists projects publicly without client contacts', async () => {
      const client = await ownerAgent
        .post('/mec-api/clients/add_client')
        .send({
          client_name: `Acme ${run}`,
          companies: [{ name: `Acme ${run}`, img: 'https://cdn.example.com/a.png', url: 'acme.com', industry: 'Retail', year: 2010 }],
          client_emails: [`buyer-${run}@acme.com`],
        })
        .expect(201);
      const work = await ownerAgent
        .post('/mec-api/work/add')
        .send({ title: `Store ${run}`, info: [{ heading: 'Scope', details: 'Full stack', img: 'https://cdn.example.com/w.png' }] })
        .expect(201);
      await ownerAgent
        .post('/mec-api/project/add')
        .send({
          project_name: `Acme Store ${run}`,
          project_image: 'https://cdn.example.com/p.png',
          short_description: 'Online store',
          project_url: 'https://acme.com',
          client_id: client.body.data.id,
          work_id: work.body.data.id,
        })
        .expect(201);

      const res = await request(server).get(`/mec-api/project/all?search=${run}`).expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].client.client_name).toBe(`Acme ${run}`);
      expect(res.body.data[0].client).not.toHaveProperty('client_emails');
    });

    it('returns a page with metadata when page/limit is passed', async () => {
      for (const n of [1, 2, 3]) {
        await ownerAgent
          .post('/mec-api/review/add')
          .send({ user_name: `Reviewer ${run} ${n}`, user_email: `r${n}-${run}@example.com`, rating: 4 })
          .expect(201);
      }
      const res = await request(server).get(`/mec-api/review/all?search=${run}&page=1&limit=2`).expect(200);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
    });

    it('rejects an invalid page size', () => request(server).get('/mec-api/review/all?limit=500').expect(400));

    it('computes invoice totals on the server', async () => {
      const res = await ownerAgent
        .post('/mec-api/invoice/add')
        .send({
          invoiceNo: `INV-${run}`,
          invoiceDate: '2026-10-24',
          clientName: 'Acme',
          items: [
            { desc: 'Design', qty: 2, rate: 1500 },
            { desc: '', qty: 1, rate: 1 },
          ],
        })
        .expect(201);
      expect(res.body.data.total).toBe(3000);
      expect(res.body.data.items).toHaveLength(1);
    });
  });

  describe('newsletter', () => {
    it('subscribes, rejects duplicates and unsubscribes via a signed link', async () => {
      const email = `reader-${run}@example.com`;
      await request(server).post('/mec-api/news/add').send({ email }).expect(201);
      await request(server).post('/mec-api/news/add').send({ email }).expect(409);

      const { unsubscribeToken } = await import('../src/newsletters/unsubscribe-token');
      const token = unsubscribeToken(email, process.env.JWT_SECRET as string);
      const link = `/mec-api/news/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
      const page = await request(server).get(link).expect(200);
      expect(page.text).toContain(email);
      await request(server).post(link).type('form').send('List-Unsubscribe=One-Click').expect(200);

      const stats = await ownerAgent.get(`/mec-api/news/get?search=${run}`).expect(200);
      expect(stats.body.data.subscribers).toHaveLength(0);
    });
  });

  describe('errors', () => {
    it('rejects malformed JSON with a readable message', async () => {
      const res = await request(server).post('/mec-api/auth/login').set('Content-Type', 'application/json').send('{bad').expect(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 in the standard envelope', async () => {
      const res = await request(server).get('/mec-api/does-not-exist').expect(404);
      expect(res.body).toMatchObject({ success: false });
    });
  });
});
