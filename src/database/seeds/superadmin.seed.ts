import { Repository } from 'typeorm';
import { Admin, AdminRole } from '../../admins/entities/admin.entity';
import { DEFAULT_SALT_ROUNDS, hashPassword, PASSWORD_MIN_LENGTH } from '../../common/passwords';

export interface SuperadminSeedOptions {
  name: string;
  email: string;
  phone: string;
  password: string;
  /** When the account already exists, also replace its password. */
  resetPassword?: boolean;
  saltRounds?: number;
}

export type SuperadminSeedResult = 'created' | 'promoted' | 'password-reset' | 'unchanged';

/** Reads the seed options from SUPERADMIN_* environment variables. */
export function superadminOptionsFromEnv(env: NodeJS.ProcessEnv): SuperadminSeedOptions {
  const email = env.SUPERADMIN_EMAIL?.trim().toLowerCase() ?? '';
  const password = env.SUPERADMIN_PASSWORD ?? '';
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('SUPERADMIN_EMAIL must be set to a valid email address');
  if (password.length < PASSWORD_MIN_LENGTH) throw new Error(`SUPERADMIN_PASSWORD must be at least ${PASSWORD_MIN_LENGTH} characters`);

  return {
    name: env.SUPERADMIN_NAME?.trim() || 'Super Admin',
    email,
    phone: env.SUPERADMIN_PHONE?.trim() || '0000000000',
    password,
    resetPassword: env.SUPERADMIN_RESET_PASSWORD === 'true',
    saltRounds: Number(env.BCRYPT_SALT_ROUNDS) || DEFAULT_SALT_ROUNDS,
  };
}

/**
 * Idempotently ensures a superadmin account exists.
 * - No account with the email: creates it.
 * - Account exists as a regular admin: promotes it to superadmin.
 * - Account exists: keeps its password unless `resetPassword` is set.
 */
export async function seedSuperadmin(admins: Repository<Admin>, options: SuperadminSeedOptions): Promise<SuperadminSeedResult> {
  const rounds = options.saltRounds ?? DEFAULT_SALT_ROUNDS;
  const existing = await admins.findOneBy({ email: options.email });

  if (!existing) {
    await admins.save(
      admins.create({
        name: options.name,
        email: options.email,
        phone: options.phone,
        password: await hashPassword(options.password, rounds),
        role: AdminRole.SUPERADMIN,
      }),
    );
    return 'created';
  }

  const changes: Partial<Admin> = {};
  if (existing.role !== AdminRole.SUPERADMIN) changes.role = AdminRole.SUPERADMIN;
  if (options.resetPassword) changes.password = await hashPassword(options.password, rounds);
  if (!Object.keys(changes).length) return 'unchanged';

  await admins.update(existing.id, changes);
  return changes.role ? 'promoted' : 'password-reset';
}
