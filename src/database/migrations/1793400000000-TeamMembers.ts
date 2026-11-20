import { MigrationInterface, QueryRunner } from 'typeorm';

/** Founders and team shown on the website's About page. */
export class TeamMembers1793400000000 implements MigrationInterface {
  name = 'TeamMembers1793400000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TABLE IF NOT EXISTS team_members(
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        name varchar(100) NOT NULL,
        role varchar(80) NOT NULL,
        bio varchar(600) NOT NULL DEFAULT '',
        photo varchar NOT NULL,
        linkedin varchar(300),
        email varchar(150),
        position integer NOT NULL DEFAULT 1 CHECK (position > 0),
        is_active boolean NOT NULL DEFAULT true
      )`,
    );
    await q.query(`CREATE INDEX IF NOT EXISTS team_members_order_idx ON team_members(position, "createdAt")`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS team_members`);
  }
}
