const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_URL'] as const;
const URLS = ['DATABASE_URL', 'R2_PUBLIC_URL', 'LOCAL_URL', 'CLIENT_URL', 'ADMIN_URL', 'API_URL', 'RESET_PASSWORD_URL'] as const;
/** Reads an env value as text; non-scalar values count as empty. */
const text = (value: unknown): string => (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '');

const INTEGER_DEFAULTS: Record<string, number> = {
  PORT: 5000,
  COOKIE_MAX_AGE_MS: 3_600_000,
  DATABASE_CONNECTION_LIMIT: 10,
  BCRYPT_SALT_ROUNDS: 12,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  MAX_UPLOAD_FILES: 10,
  RATE_LIMIT_WINDOW_MS: 900_000,
  RATE_LIMIT_MAX_REQUESTS: 150,
};

export function validateEnvironment(input: Record<string, unknown>): Record<string, unknown> {
  const env = { ...input };

  const missing = REQUIRED.filter((key) => !text(env[key]).trim());
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  if (text(env.JWT_SECRET).length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');

  for (const key of URLS) {
    const value = text(env[key]).trim();
    if (!value) continue;
    try {
      new URL(value);
    } catch {
      throw new Error(`${key} must be a valid URL`);
    }
  }

  for (const [key, fallback] of Object.entries(INTEGER_DEFAULTS)) {
    const raw = env[key];
    const value = raw === undefined || raw === '' ? fallback : Number(raw);
    if (!Number.isInteger(value) || value <= 0) throw new Error(`${key} must be a positive integer`);
    env[key] = value;
  }

  if (env.NODE_ENV === 'production' && env.DB_SYNCHRONIZE === 'true') {
    throw new Error('DB_SYNCHRONIZE cannot be enabled in production');
  }
  return env;
}
