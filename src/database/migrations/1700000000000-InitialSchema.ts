import { MigrationInterface, QueryRunner } from 'typeorm';
export class InitialSchema1700000000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    // gen_random_uuid() is built into PostgreSQL 13+, so no extension is required.
    await q.query(
      `CREATE TABLE admins(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),img varchar,name varchar(100) NOT NULL,email varchar UNIQUE NOT NULL,phone varchar NOT NULL,password varchar NOT NULL,role varchar NOT NULL DEFAULT 'admin',"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(
      `CREATE TABLE password_resets(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),"userId" uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,"tokenHash" varchar UNIQUE NOT NULL,"expiresAt" timestamptz NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(
      `CREATE INDEX password_resets_user_idx ON password_resets("userId");CREATE INDEX password_resets_expiry_idx ON password_resets("expiresAt")`,
    );
    await q.query(
      `CREATE TABLE blogs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),blog_name varchar NOT NULL,blog_images text[] NOT NULL DEFAULT '{}',short_description varchar(250) NOT NULL,blog_descriptions jsonb NOT NULL DEFAULT '[]',is_active boolean NOT NULL DEFAULT true,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(
      `CREATE TABLE clients(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),client_name varchar NOT NULL,companies jsonb NOT NULL DEFAULT '[]',client_emails text[] NOT NULL DEFAULT '{}',client_phones text[] NOT NULL DEFAULT '{}',is_active boolean NOT NULL DEFAULT true,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(
      `CREATE TABLE reviews(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_name varchar NOT NULL,user_email varchar NOT NULL,company_name varchar NOT NULL DEFAULT '',rating smallint NOT NULL CHECK(rating BETWEEN 1 AND 5),comment varchar(500) NOT NULL DEFAULT '',is_verified boolean NOT NULL DEFAULT false,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(
      `CREATE TABLE projects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),project_name varchar NOT NULL,project_image varchar NOT NULL,short_description varchar(250) NOT NULL,project_url varchar NOT NULL,client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,work_id uuid,is_active boolean NOT NULL DEFAULT true,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(
      `CREATE TABLE works(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),title varchar(100) NOT NULL,info jsonb NOT NULL DEFAULT '[]',project_id uuid REFERENCES projects(id) ON DELETE SET NULL,is_active boolean NOT NULL DEFAULT true,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(`ALTER TABLE projects ADD CONSTRAINT projects_work_fk FOREIGN KEY(work_id) REFERENCES works(id) ON DELETE SET NULL`);
    await q.query(
      `CREATE TABLE banners(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name varchar(100) NOT NULL,description varchar(500) NOT NULL,img varchar NOT NULL,position integer UNIQUE NOT NULL CHECK(position>0),time timestamptz NOT NULL DEFAULT now(),is_active boolean NOT NULL DEFAULT true,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(
      `CREATE TABLE enquiries(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name varchar NOT NULL,email varchar NOT NULL,phone varchar NOT NULL,company_name varchar NOT NULL DEFAULT '',message varchar(1000) NOT NULL,is_opened boolean NOT NULL DEFAULT false,opened_at timestamptz,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(
      `CREATE TABLE newsletters(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email varchar UNIQUE NOT NULL,"subscribedAt" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(
      `CREATE TABLE vouchers(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),title varchar NOT NULL,img text[] NOT NULL DEFAULT '{}',heading text[] NOT NULL DEFAULT '{}',msg text[] NOT NULL DEFAULT '{}',"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(
      `CREATE TABLE invoices(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),"invoiceNo" varchar UNIQUE NOT NULL,"invoiceDate" date NOT NULL,"dueDate" date,"clientName" varchar NOT NULL,"clientEmail" varchar NOT NULL DEFAULT '',"clientPhone" varchar NOT NULL DEFAULT '',items jsonb NOT NULL DEFAULT '[]',"pageCount" integer NOT NULL DEFAULT 1,subtotal numeric(14,2) NOT NULL DEFAULT 0,total numeric(14,2) NOT NULL DEFAULT 0,status varchar NOT NULL DEFAULT 'draft',"billGeneratedAt" timestamptz,"sentAt" timestamptz,"sentBy" jsonb NOT NULL DEFAULT '{"email":false,"whatsapp":false}',notes text NOT NULL DEFAULT '',"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(
      `CREATE INDEX blogs_active_idx ON blogs(is_active);CREATE INDEX clients_active_idx ON clients(is_active);CREATE INDEX reviews_verified_idx ON reviews(is_verified);CREATE INDEX projects_active_idx ON projects(is_active);CREATE INDEX works_active_idx ON works(is_active);CREATE INDEX enquiries_opened_idx ON enquiries(is_opened);CREATE INDEX invoices_status_idx ON invoices(status);CREATE INDEX invoices_created_idx ON invoices("createdAt" DESC);CREATE INDEX clients_companies_gin ON clients USING GIN(companies)`,
    );
  }
  async down(q: QueryRunner) {
    for (const table of [
      'invoices',
      'vouchers',
      'newsletters',
      'enquiries',
      'banners',
      'works',
      'projects',
      'reviews',
      'clients',
      'blogs',
      'password_resets',
      'admins',
    ])
      await q.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
  }
}
