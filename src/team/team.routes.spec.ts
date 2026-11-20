import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { Admin, AdminRole } from '../admins/entities/admin.entity';
import { ENTITIES } from '../database/entities';
import { MailService } from '../mail/mail.service';
import { StorageService } from '../storage/storage.service';
import { TeamMember } from './entities/team-member.entity';

describe('team publication and admin routes', () => {
  let app: NestExpressApplication;
  let base: string;
  let token: string;
  let members: TeamMember[];
  let fetchSpy: jest.SpyInstance;
  const admin = { id: randomUUID(), email: 'staff@example.com', role: AdminRole.ADMIN };
  const publicId = randomUUID(), hiddenId = randomUUID();
  const originalFetch = global.fetch;
  const storage = { upload: jest.fn(() => Promise.resolve([{ url: 'https://media.example.com/portrait.png' }])) };
  const repository = {
    create: (dto: Partial<TeamMember>) => ({ bio: '', linkedin: null, email: null, position: 1, is_active: true, ...dto }),
    save: jest.fn((member: TeamMember) => {
      const saved = { ...member, id: member.id ?? randomUUID(), createdAt: member.createdAt ?? new Date(), updatedAt: new Date() };
      members = [...members.filter((item) => item.id !== saved.id), saved];
      return Promise.resolve(saved);
    }),
    findOneBy: jest.fn(({ id }: { id: string }) => Promise.resolve(members.find((member) => member.id === id))),
    createQueryBuilder: () => {
      let activeOnly = false, skip = 0, take = members.length;
      const ordered = () => members.filter((member) => !activeOnly || member.is_active).sort((a, b) => a.position - b.position);
      const query = {
        orderBy: () => query, addOrderBy: () => query,
        where: () => { activeOnly = true; return query; },
        skip: (value: number) => { skip = value; return query; },
        take: (value: number) => { take = value; return query; },
        getMany: () => Promise.resolve(ordered()),
        getManyAndCount: () => Promise.resolve([ordered().slice(skip, skip + take), ordered().length]),
      };
      return query;
    },
  };

  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: 'test', DATABASE_URL: 'postgresql://test:test@localhost:5432/team_test',
      JWT_SECRET: 'team-test-secret-at-least-thirty-two-characters',
      R2_ACCOUNT_ID: 'test', R2_ACCESS_KEY_ID: 'test', R2_SECRET_ACCESS_KEY: 'test',
      R2_BUCKET: 'test', R2_PUBLIC_URL: 'https://media.example.com',
      DB_SSL: 'false', DB_SYNCHRONIZE: 'false', SWAGGER_ENABLED: 'false', ADMIN_EMAIL: '',
      SITE_REVALIDATE_URL: 'http://team-webhook.test/api/revalidate', SITE_REVALIDATE_SECRET: 'team-test-refresh-secret',
    });
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation((...args) => {
      if (args[0] === process.env.SITE_REVALIDATE_URL) return Promise.resolve(Response.json({ ok: true }));
      return originalFetch(...args);
    });
    const { AppModule } = await import('../app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DataSource).useValue({
        options: { type: 'postgres' }, entityMetadatas: [], manager: {}, isInitialized: false,
        getRepository: (entity: unknown) => entity === TeamMember ? repository : entity === Admin ? { findOne: () => Promise.resolve(admin) } : {},
      })
      .overrideProvider(MailService).useValue({ trySend: jest.fn() })
      .overrideProvider(StorageService).useValue(storage)
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('mec-api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
    token = await app.get(JwtService).signAsync(admin);
  });
  afterAll(async () => { await app?.close(); fetchSpy?.mockRestore(); });
  beforeEach(() => {
    members = [
      { ...repository.create({ name: 'Founder', role: 'Founder', photo: 'https://media.example.com/founder.png', position: 2 }), id: publicId, createdAt: new Date(), updatedAt: new Date() },
      { ...repository.create({ name: 'Hidden member', role: 'Engineer', photo: 'https://media.example.com/team.png', position: 1, is_active: false }), id: hiddenId, createdAt: new Date(), updatedAt: new Date() },
    ] as TeamMember[];
    jest.clearAllMocks();
  });
  const headers = () => ({ Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' });

  it('registers the team entity for application queries and migrations', () => {
    expect(ENTITIES).toContain(TeamMember);
  });
  it('returns published people to the public website without a login', async () => {
    const response = await fetch(base + '/mec-api/team/get');
    expect(response.status).toBe(200);
    const json = await response.json() as { data: TeamMember[] };
    expect(json.data.map((member) => member.id)).toEqual([publicId]);
    expect(json.data[0]).not.toHaveProperty('is_active');
  });
  it('requires authentication for the admin list and all writes', async () => {
    expect((await fetch(base + '/mec-api/team/all')).status).toBe(401);
    expect((await fetch(base + '/mec-api/team/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status).toBe(401);
  });
  it('shows hidden and active people in the paginated admin list, in display order', async () => {
    const response = await fetch(base + '/mec-api/team/all?page=1&limit=20', { headers: headers() });
    expect(response.status).toBe(200);
    const json = await response.json() as { data: { items: TeamMember[]; meta: { total: number } } };
    expect(json.data.items.map((member) => member.id)).toEqual([hiddenId, publicId]);
    expect(json.data.items[0].is_active).toBe(false);
    expect(json.data.meta.total).toBe(2);
  });
  it('publishes a hidden person and refreshes the website team cache', async () => {
    const response = await fetch(base + '/mec-api/team/edit/' + hiddenId, { method: 'PUT', headers: headers(), body: JSON.stringify({ is_active: true }) });
    expect(response.status).toBe(200);
    const published = await fetch(base + '/mec-api/team/get');
    const json = await published.json() as { data: TeamMember[] };
    expect(json.data.map((member) => member.id)).toEqual([hiddenId, publicId]);
    expect(fetchSpy).toHaveBeenCalledWith(process.env.SITE_REVALIDATE_URL, expect.objectContaining({
      method: 'POST', body: JSON.stringify({ tags: ['team'] }),
    }));
  });
  it('hides a person without removing their admin record', async () => {
    const response = await fetch(base + '/mec-api/team/edit/' + publicId, { method: 'PUT', headers: headers(), body: JSON.stringify({ is_active: false }) });
    expect(response.status).toBe(200);
    const published = await fetch(base + '/mec-api/team/get');
    expect((await published.json() as { data: TeamMember[] }).data).toEqual([]);
    expect(members).toHaveLength(2);
  });
  it('accepts the team photo upload folder used by mec-admin', async () => {
    const body = new FormData();
    body.append('folder', 'team');
    body.append('images', new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }), 'portrait.png');
    const response = await fetch(base + '/mec-api/img/upload', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body });
    expect(response.status).toBe(201);
    expect(storage.upload).toHaveBeenCalledWith(expect.any(Array), 'team');
  });
});
