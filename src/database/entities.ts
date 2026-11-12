import { Admin } from '../admins/entities/admin.entity';
import { PasswordReset } from '../auth/entities/password-reset.entity';
import { Banner } from '../banners/entities/banner.entity';
import { Blog } from '../blogs/entities/blog.entity';
import { Client } from '../clients/entities/client.entity';
import { Enquiry } from '../enquiries/entities/enquiry.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Newsletter } from '../newsletters/entities/newsletter.entity';
import { SitePreview } from '../previews/entities/site-preview.entity';
import { Project } from '../projects/entities/project.entity';
import { Review } from '../reviews/entities/review.entity';
import { SiteSetting } from '../settings/entities/site-setting.entity';
import { ThirukkuralChapter } from '../thirukkural/entities/thirukkural-chapter.entity';
import { Thirukkural } from '../thirukkural/entities/thirukkural.entity';
import { TeamMember } from '../team/entities/team-member.entity';
import { Voucher } from '../vouchers/entities/voucher.entity';
import { Work } from '../works/entities/work.entity';

/** Every TypeORM entity, shared by the Nest app and the CLI data source (migrations, seeds). */
export const ENTITIES = [
  Admin,
  PasswordReset,
  Blog,
  Client,
  Review,
  Project,
  Work,
  Banner,
  Enquiry,
  Newsletter,
  Voucher,
  Invoice,
  SitePreview,
  SiteSetting,
  ThirukkuralChapter,
  Thirukkural,
  TeamMember,
];
