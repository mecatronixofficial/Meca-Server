import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProjectMedia1793500000000 implements MigrationInterface {
  name = 'ProjectMedia1793500000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE IF NOT EXISTS project_media (
      slug varchar(80) PRIMARY KEY,
      images jsonb NOT NULL DEFAULT '[]'::jsonb,
      videos jsonb NOT NULL DEFAULT '[]'::jsonb,
      "updatedAt" timestamptz NOT NULL DEFAULT now()
    )`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE IF EXISTS project_media');
  }
}

