import { Injectable } from '@nestjs/common';
import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { Admin, AdminRole } from '../admins/entities/admin.entity';
import { Banner } from '../banners/entities/banner.entity';
import { Blog } from '../blogs/entities/blog.entity';
import { Client } from '../clients/entities/client.entity';
import { Enquiry } from '../enquiries/entities/enquiry.entity';
import { Newsletter } from '../newsletters/entities/newsletter.entity';
import { Project } from '../projects/entities/project.entity';
import { Review } from '../reviews/entities/review.entity';
import { Work } from '../works/entities/work.entity';

@Injectable()
export class DashboardService {
  constructor(private readonly db: DataSource) {}

  async stats() {
    const [banners, blogs, clients, works, projects, subscribers, reviews, enquiries, admins] = await Promise.all([
      this.count(Banner),
      this.count(Blog),
      this.count(Client),
      this.count(Work),
      this.count(Project),
      this.count(Newsletter),
      this.split(Review, { is_verified: true }, 'verified', 'unverified'),
      this.split(Enquiry, { is_opened: true }, 'opened', 'unopened'),
      this.split(Admin, { role: AdminRole.SUPERADMIN }, 'superadmin', 'admin'),
    ]);
    return { banners, blogs, clients, works, projects, reviews, enquiries, subscribers, admins };
  }

  private count<T extends ObjectLiteral>(entity: EntityTarget<T>) {
    return this.db.getRepository(entity).count();
  }

  /** Counts rows matching `where` vs. the rest, e.g. `{ verified, unverified, total }`. */
  private async split<T extends ObjectLiteral, Y extends string, N extends string>(entity: EntityTarget<T>, where: Partial<T>, yes: Y, no: N) {
    const repo = this.db.getRepository(entity);
    const [matching, total] = await Promise.all([repo.countBy(where as never), repo.count()]);
    return { [yes]: matching, [no]: total - matching, total } as Record<Y | N | 'total', number>;
  }
}
