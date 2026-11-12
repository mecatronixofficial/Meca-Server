import { MigrationInterface, QueryRunner } from 'typeorm';

/** Optional banner details for the website: a label, highlight points and a call-to-action button. */
export class BannerDetails1793300000000 implements MigrationInterface {
  name = 'BannerDetails1793300000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE banners ADD COLUMN IF NOT EXISTS tag varchar(40)`);
    await q.query(`ALTER TABLE banners ADD COLUMN IF NOT EXISTS highlights text[] NOT NULL DEFAULT '{}'`);
    await q.query(`ALTER TABLE banners ADD COLUMN IF NOT EXISTS cta_label varchar(40)`);
    await q.query(`ALTER TABLE banners ADD COLUMN IF NOT EXISTS cta_link varchar(300)`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE banners DROP COLUMN IF EXISTS cta_link`);
    await q.query(`ALTER TABLE banners DROP COLUMN IF EXISTS cta_label`);
    await q.query(`ALTER TABLE banners DROP COLUMN IF EXISTS highlights`);
    await q.query(`ALTER TABLE banners DROP COLUMN IF EXISTS tag`);
  }
}
