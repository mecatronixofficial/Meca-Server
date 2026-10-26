import { getMetadataArgsStorage } from 'typeorm';
import { ENTITIES } from './entities';

describe('PostgreSQL domain model', () => {
  it('registers a dedicated table for every domain', () => {
    const tables = getMetadataArgsStorage()
      .tables.filter((table) => ENTITIES.includes(table.target as (typeof ENTITIES)[number]))
      .map((table) => table.name);
    expect(tables.sort()).toEqual(
      [
        'admins',
        'banners',
        'blogs',
        'clients',
        'enquiries',
        'invoices',
        'newsletters',
        'password_resets',
        'projects',
        'reviews',
        'vouchers',
        'works',
      ].sort(),
    );
  });
});
