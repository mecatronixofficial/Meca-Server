import 'dotenv/config';
import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';
import { ENTITIES } from './entities';
import { postgresSsl, postgresUrl } from './postgres-connection';

// Picks .ts migrations under ts-node and compiled .js under dist (never .d.ts).
const migrationExt = __filename.endsWith('.ts') ? '*.ts' : '*.js';

/** Data source for the TypeORM CLI (migrations) and standalone scripts (seeds). */
export default new DataSource({
  type: 'postgres',
  url: postgresUrl(process.env.DATABASE_URL ?? ''),
  ssl: postgresSsl(process.env),
  entities: ENTITIES,
  migrations: [path.join(__dirname, 'migrations', migrationExt)],
  synchronize: false,
});
