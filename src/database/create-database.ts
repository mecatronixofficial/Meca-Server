import 'dotenv/config';
import { Client } from 'pg';
import { postgresSsl, postgresUrl } from './postgres-connection';

/**
 * Creates the database named in DATABASE_URL if it does not exist yet.
 * Connects through a maintenance database (DB_MAINTENANCE_NAME, default "defaultdb" then "postgres") to do so.
 * Never drops or modifies anything else.
 */
async function main() {
  const target = new URL(postgresUrl(process.env.DATABASE_URL ?? ''));
  const name = decodeURIComponent(target.pathname.replace(/^\//, ''));
  if (!name) throw new Error('DATABASE_URL must include a database name');

  const candidates = [process.env.DB_MAINTENANCE_NAME, 'defaultdb', 'postgres'].filter((db): db is string => !!db && db !== name);
  let lastError: Error | undefined;

  for (const maintenance of candidates) {
    const url = new URL(target.toString());
    url.pathname = `/${maintenance}`;
    const client = new Client({ connectionString: url.toString(), ssl: postgresSsl(process.env) });
    try {
      await client.connect();
    } catch (error) {
      lastError = error as Error;
      continue;
    }
    try {
      const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
      if (rowCount) {
        console.log(`Database "${name}" already exists; nothing to do.`);
      } else {
        await client.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`);
        console.log(`Database "${name}" created.`);
      }
      return;
    } finally {
      await client.end();
    }
  }
  throw lastError ?? new Error('No maintenance database available');
}

main().catch((error: Error) => {
  console.error(`Database creation failed: ${error.message}`);
  process.exit(1);
});
