import { validateEnvironment } from './environment';

const valid = {
  NODE_ENV: 'test',
  PORT: '5000',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_SECRET: 'a-secure-secret-that-is-longer-than-thirty-two-characters',
  R2_ACCOUNT_ID: 'account',
  R2_ACCESS_KEY_ID: 'key',
  R2_SECRET_ACCESS_KEY: 'secret',
  R2_BUCKET: 'bucket',
  R2_PUBLIC_URL: 'https://cdn.example.com',
  LOCAL_URL: 'http://localhost:5173',
  CLIENT_URL: 'https://example.com',
  ADMIN_URL: 'https://admin.example.com',
};

describe('environment validation', () => {
  it('normalizes numeric configuration', () => expect(validateEnvironment(valid).PORT).toBe(5000));
  it('applies defaults for optional numbers', () => expect(validateEnvironment(valid).BCRYPT_SALT_ROUNDS).toBe(12));
  it('rejects a weak JWT secret', () => expect(() => validateEnvironment({ ...valid, JWT_SECRET: 'short' })).toThrow('at least 32'));
  it('rejects a non-numeric limit', () => expect(() => validateEnvironment({ ...valid, MAX_UPLOAD_FILES: 'ten' })).toThrow('positive integer'));
  it('rejects synchronization in production', () =>
    expect(() => validateEnvironment({ ...valid, NODE_ENV: 'production', DB_SYNCHRONIZE: 'true' })).toThrow('cannot be enabled'));
});
