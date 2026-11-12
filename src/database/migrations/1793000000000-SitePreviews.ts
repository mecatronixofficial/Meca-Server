import { MigrationInterface, QueryRunner } from 'typeorm';

/** "Preview your own website" requests from the public site (also leads for the admin panel). */
export class SitePreviews1793000000000 implements MigrationInterface {
  name = 'SitePreviews1793000000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TABLE IF NOT EXISTS site_previews(
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name varchar(120) NOT NULL,
        industry varchar(40) NOT NULL,
        tagline varchar(160) NOT NULL DEFAULT '',
        description varchar(600) NOT NULL DEFAULT '',
        logo_url varchar,
        brand_color varchar(7) NOT NULL,
        services text[] NOT NULL DEFAULT '{}',
        contact_name varchar(100) NOT NULL,
        email varchar(254) NOT NULL,
        phone varchar(30) NOT NULL DEFAULT '',
        city varchar(100) NOT NULL DEFAULT '',
        view_count integer NOT NULL DEFAULT 0,
        last_viewed_at timestamptz,
        is_contacted boolean NOT NULL DEFAULT false,
        notes varchar(1000) NOT NULL DEFAULT '',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )`,
    );
    await q.query(`CREATE INDEX IF NOT EXISTS site_previews_industry_idx ON site_previews(industry)`);
    await q.query(`CREATE INDEX IF NOT EXISTS site_previews_email_idx ON site_previews(email)`);
    await q.query(`CREATE INDEX IF NOT EXISTS site_previews_contacted_idx ON site_previews(is_contacted)`);
    await q.query(`CREATE INDEX IF NOT EXISTS site_previews_created_idx ON site_previews("createdAt")`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS site_previews`);
  }
}
