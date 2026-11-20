import { Injectable } from '@nestjs/common';
import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { Admin, AdminRole } from '../admins/entities/admin.entity';
import { Banner } from '../banners/entities/banner.entity';
import { Blog } from '../blogs/entities/blog.entity';
import { Client } from '../clients/entities/client.entity';
import { Enquiry } from '../enquiries/entities/enquiry.entity';
import { Newsletter } from '../newsletters/entities/newsletter.entity';
import { Project } from '../projects/entities/project.entity';
import { SitePreview } from '../previews/entities/site-preview.entity';
import { Review } from '../reviews/entities/review.entity';
import { Work } from '../works/entities/work.entity';

type Split<Y extends string, N extends string> = Record<Y | N | 'total', number>;

@Injectable()
export class DashboardService {
  constructor(private readonly db: DataSource) {}

  /**
   * Every dashboard count in one round trip. The admin shell reloads these on each navigation
   * (sidebar badges), so 16 separate queries per page view would tie up a small connection pool.
   */
  async stats() {
    const counts = new CountQuery(this.db);
    const banners = counts.total(Banner);
    const blogs = counts.total(Blog);
    const clients = counts.total(Client);
    const works = counts.total(Work);
    const projects = counts.total(Project);
    const subscribers = counts.total(Newsletter);
    const reviews = counts.split(Review, 'is_verified', true, 'verified', 'unverified');
    const enquiries = counts.split(Enquiry, 'is_opened', true, 'opened', 'unopened');
    const admins = counts.split(Admin, 'role', AdminRole.SUPERADMIN, 'superadmin', 'admin');
    const previews = counts.split(SitePreview, 'is_contacted', true, 'contacted', 'uncontacted');
    await counts.run();

    return {
      banners: banners(),
      blogs: blogs(),
      clients: clients(),
      works: works(),
      projects: projects(),
      reviews: reviews(),
      enquiries: enquiries(),
      subscribers: subscribers(),
      admins: admins(),
      previews: previews(),
    };
  }
}

/** Collects `count(*)` sub-selects into a single SELECT; each helper returns a getter for its result. */
class CountQuery {
  private readonly columns: string[] = [];
  private readonly params: unknown[] = [];
  private row: Record<string, number | string> = {};

  constructor(private readonly db: DataSource) {}

  total<T extends ObjectLiteral>(entity: EntityTarget<T>): () => number {
    const alias = this.add(`SELECT count(*) FROM ${this.table(entity)}`);
    return () => this.value(alias);
  }

  /** Rows where `property = value` vs. the rest, e.g. `{ verified, unverified, total }`. */
  split<T extends ObjectLiteral, Y extends string, N extends string>(
    entity: EntityTarget<T>,
    property: keyof T & string,
    value: unknown,
    yes: Y,
    no: N,
  ): () => Split<Y, N> {
    const column = this.db.getMetadata(entity).findColumnWithPropertyName(property);
    if (!column) throw new Error(`Unknown column ${property}`);
    this.params.push(value);
    const matching = this.add(`SELECT count(*) FROM ${this.table(entity)} WHERE ${this.db.driver.escape(column.databaseName)} = $${this.params.length}`);
    const all = this.add(`SELECT count(*) FROM ${this.table(entity)}`);
    return () => {
      const total = this.value(all);
      const yesCount = this.value(matching);
      return { [yes]: yesCount, [no]: total - yesCount, total } as Split<Y, N>;
    };
  }

  async run() {
    const rows: Record<string, number | string>[] = await this.db.query(`SELECT ${this.columns.join(', ')}`, this.params);
    this.row = rows[0] ?? {};
  }

  private add(subquery: string) {
    const alias = `c${this.columns.length}`;
    this.columns.push(`(${subquery})::int AS "${alias}"`);
    return alias;
  }

  private table<T extends ObjectLiteral>(entity: EntityTarget<T>) {
    const { schema, tableName } = this.db.getMetadata(entity);
    return [schema, tableName].filter(Boolean).map((part) => this.db.driver.escape(part as string)).join('.');
  }

  private value(alias: string) {
    return Number(this.row[alias] ?? 0);
  }
}
