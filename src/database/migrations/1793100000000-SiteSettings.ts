import { MigrationInterface, QueryRunner } from 'typeorm';

/** Website settings edited in the admin panel (contact details, social links, addresses, hours). */
export class SiteSettings1793100000000 implements MigrationInterface {
  name = 'SiteSettings1793100000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TABLE IF NOT EXISTS site_settings(
        key varchar(60) PRIMARY KEY,
        value jsonb NOT NULL,
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )`,
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS site_settings`);
  }
}
