import dataSource from '../data-source';
import { Admin } from '../../admins/entities/admin.entity';
import { seedSuperadmin, superadminOptionsFromEnv } from './superadmin.seed';

const MESSAGES = {
  created: 'Superadmin account created',
  promoted: 'Existing admin promoted to superadmin',
  'password-reset': 'Superadmin password reset',
  unchanged: 'Superadmin already exists; nothing changed (set SUPERADMIN_RESET_PASSWORD=true to reset its password)',
} as const;

/** CLI entry point: `npm run seed:superadmin` (dev) or `npm run seed:superadmin:prod` (built). */
async function main() {
  const options = superadminOptionsFromEnv(process.env);
  await dataSource.initialize();
  try {
    const result = await seedSuperadmin(dataSource.getRepository(Admin), options);
    console.log(`${MESSAGES[result]}: ${options.email}`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: Error) => {
  console.error(`Superadmin seed failed: ${error.message}`);
  process.exit(1);
});
