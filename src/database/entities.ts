import { Admin } from '../admins/entities/admin.entity';
import { PasswordReset } from '../auth/entities/password-reset.entity';
import { Banner } from '../banners/entities/banner.entity';
import { Blog } from '../blogs/entities/blog.entity';
import { Client } from '../clients/entities/client.entity';
import { Enquiry } from '../enquiries/entities/enquiry.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Newsletter } from '../newsletters/entities/newsletter.entity';
import { Project } from '../projects/entities/project.entity';
import { Review } from '../reviews/entities/review.entity';
import { Voucher } from '../vouchers/entities/voucher.entity';
import { Work } from '../works/entities/work.entity';

/** Every TypeORM entity, shared by the Nest app and the CLI data source (migrations, seeds). */
export const ENTITIES = [Admin, PasswordReset, Blog, Client, Review, Project, Work, Banner, Enquiry, Newsletter, Voucher, Invoice];
