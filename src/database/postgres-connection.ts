import { existsSync, readFileSync } from 'fs';

type Env = Record<string, unknown>;

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

/**
 * TLS settings for PostgreSQL.
 * - DB_SSL=false: plain connection.
 * - DB_SSL=true + DB_SSL_CA: verify the server against that CA (PEM text or a file path). Use this with Aiven's ca.pem.
 * - DB_SSL=true without a CA: encrypted but unverified (accepts self-signed certificates).
 */
export function postgresSsl(env: Env): false | { ca?: string; rejectUnauthorized: boolean } {
  if (text(env.DB_SSL) !== 'true') return false;
  const ca = text(env.DB_SSL_CA).trim();
  if (!ca) return { rejectUnauthorized: false };
  const pem = ca.includes('BEGIN CERTIFICATE') ? ca.replace(/\\n/g, '\n') : existsSync(ca) ? readFileSync(ca, 'utf8') : null;
  if (!pem) throw new Error('DB_SSL_CA must be PEM certificate text or a path to an existing file');
  return { ca: pem, rejectUnauthorized: true };
}

/** Removes `sslmode`/`ssl*` URL params, which would otherwise override the explicit TLS settings above. */
export function postgresUrl(url: string): string {
  const parsed = new URL(url);
  for (const key of [...parsed.searchParams.keys()]) if (key.startsWith('ssl')) parsed.searchParams.delete(key);
  return parsed.toString();
}
