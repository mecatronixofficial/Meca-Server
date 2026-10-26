import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Admin, AdminRole } from '../../admins/entities/admin.entity';
import { seedSuperadmin, superadminOptionsFromEnv } from './superadmin.seed';

const options = { name: 'Owner', email: 'owner@example.com', phone: '9999999999', password: 'a-strong-password', saltRounds: 4 };

const repoWith = (existing: Partial<Admin> | null) => {
  const repo = {
    findOneBy: jest.fn().mockResolvedValue(existing),
    create: jest.fn((value) => value),
    save: jest.fn((value) => Promise.resolve(value)),
    update: jest.fn().mockResolvedValue(undefined),
  };
  return repo as typeof repo & Repository<Admin>;
};

describe('seedSuperadmin', () => {
  it('creates a superadmin with a hashed password when none exists', async () => {
    const repo = repoWith(null);
    await expect(seedSuperadmin(repo, options)).resolves.toBe('created');
    const saved = repo.save.mock.calls[0][0] as Admin;
    expect(saved.role).toBe(AdminRole.SUPERADMIN);
    expect(saved.password).not.toBe(options.password);
    expect(await bcrypt.compare(options.password, saved.password)).toBe(true);
  });

  it('promotes an existing regular admin without touching the password', async () => {
    const repo = repoWith({ id: 'a1', role: AdminRole.ADMIN });
    await expect(seedSuperadmin(repo, options)).resolves.toBe('promoted');
    expect(repo.update).toHaveBeenCalledWith('a1', { role: AdminRole.SUPERADMIN });
  });

  it('is a no-op when the superadmin already exists', async () => {
    const repo = repoWith({ id: 'a1', role: AdminRole.SUPERADMIN });
    await expect(seedSuperadmin(repo, options)).resolves.toBe('unchanged');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('resets the password only when asked', async () => {
    const repo = repoWith({ id: 'a1', role: AdminRole.SUPERADMIN });
    await expect(seedSuperadmin(repo, { ...options, resetPassword: true })).resolves.toBe('password-reset');
    expect(repo.update).toHaveBeenCalledWith('a1', { password: expect.any(String) });
  });
});

describe('superadminOptionsFromEnv', () => {
  it('requires a valid email and a strong password', () => {
    expect(() => superadminOptionsFromEnv({ SUPERADMIN_EMAIL: 'nope', SUPERADMIN_PASSWORD: 'a-strong-password' })).toThrow('SUPERADMIN_EMAIL');
    expect(() => superadminOptionsFromEnv({ SUPERADMIN_EMAIL: 'a@b.co', SUPERADMIN_PASSWORD: 'short' })).toThrow('SUPERADMIN_PASSWORD');
  });

  it('normalizes the email', () => {
    expect(superadminOptionsFromEnv({ SUPERADMIN_EMAIL: ' Owner@Example.com ', SUPERADMIN_PASSWORD: 'a-strong-password' }).email).toBe(
      'owner@example.com',
    );
  });
});
