import { DataSource } from 'typeorm';
import { AdminRole } from '../admins/entities/admin.entity';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('reads every count in a single query and splits the flagged totals', async () => {
    const query = jest.fn((sql: string, params: unknown[]) => {
      const aliases = [...sql.matchAll(/AS "(c\d+)"/g)].map((match) => match[1]);
      // Every total is 10 and every "matching" count is 4.
      const row = Object.fromEntries(aliases.map((alias, index) => [alias, sql.split(', (')[index]?.includes('WHERE') ? 4 : 10]));
      expect(params).toEqual([true, true, AdminRole.SUPERADMIN, true]);
      return Promise.resolve([row]);
    });
    const db = {
      getMetadata: (entity: { name: string }) => ({
        schema: undefined,
        tableName: entity.name.toLowerCase(),
        findColumnWithPropertyName: (property: string) => ({ databaseName: property }),
      }),
      driver: { escape: (name: string) => `"${name}"` },
      query,
    } as unknown as DataSource;

    const stats = await new DashboardService(db).stats();

    expect(query).toHaveBeenCalledTimes(1);
    expect(stats.banners).toBe(10);
    expect(stats.reviews).toEqual({ verified: 4, unverified: 6, total: 10 });
    expect(stats.enquiries).toEqual({ opened: 4, unopened: 6, total: 10 });
    expect(stats.admins).toEqual({ superadmin: 4, admin: 6, total: 10 });
    expect(stats.previews).toEqual({ contacted: 4, uncontacted: 6, total: 10 });
  });
});
