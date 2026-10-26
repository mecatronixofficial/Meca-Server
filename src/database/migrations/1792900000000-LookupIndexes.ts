import { MigrationInterface, QueryRunner } from 'typeorm';

/** Indexes for lookups, foreign keys and admin-list searches that the initial schema did not create. */
const INDEXES: Array<[name: string, table: string, column: string]> = [
  ['blogs_name_idx', 'blogs', 'blog_name'],
  ['clients_name_idx', 'clients', 'client_name'],
  ['reviews_email_idx', 'reviews', 'user_email'],
  ['projects_name_idx', 'projects', 'project_name'],
  ['projects_client_idx', 'projects', 'client_id'],
  ['projects_work_idx', 'projects', 'work_id'],
  ['works_title_idx', 'works', 'title'],
  ['works_project_idx', 'works', 'project_id'],
  ['banners_active_idx', 'banners', 'is_active'],
  ['enquiries_email_idx', 'enquiries', 'email'],
  ['vouchers_title_idx', 'vouchers', 'title'],
  ['invoices_date_idx', 'invoices', 'invoiceDate'],
  ['invoices_client_email_idx', 'invoices', 'clientEmail'],
];

export class LookupIndexes1792900000000 implements MigrationInterface {
  name = 'LookupIndexes1792900000000';

  async up(q: QueryRunner): Promise<void> {
    for (const [name, table, column] of INDEXES) await q.query(`CREATE INDEX IF NOT EXISTS "${name}" ON "${table}" ("${column}")`);
  }

  async down(q: QueryRunner): Promise<void> {
    for (const [name] of [...INDEXES].reverse()) await q.query(`DROP INDEX IF EXISTS "${name}"`);
  }
}
