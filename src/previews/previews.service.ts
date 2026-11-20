import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUrls } from '../common/app-urls';
import { applySearch, ListResult, paginate } from '../common/pagination';
import { MailService } from '../mail/mail.service';
import { detectFileType } from '../storage/file-type';
import { StorageService } from '../storage/storage.service';
import { CreateSitePreviewDto, SitePreviewQueryDto, UpdateSitePreviewDto } from './dto/site-preview.dto';
import { SitePreview } from './entities/site-preview.entity';

/** Logos are shown on the website, so keep them small. */
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/** Fields the public website may show on a preview (no internal notes or follow-up status). */
const PUBLIC_FIELDS = ['id', 'company_name', 'industry', 'tagline', 'description', 'logo_url', 'brand_color', 'services', 'phone', 'email', 'city', 'createdAt'] as const;
export type PublicSitePreview = Pick<SitePreview, (typeof PUBLIC_FIELDS)[number]>;

@Injectable()
export class PreviewsService {
  constructor(
    @InjectRepository(SitePreview) private readonly previews: Repository<SitePreview>,
    private readonly storage: StorageService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly urls: AppUrls,
  ) {}

  /** Saves the request (uploading the logo, if any) and tells the team about the new lead. */
  async create(dto: CreateSitePreviewDto, logo?: Express.Multer.File) {
    let logoUrl: string | null = null;
    if (logo) {
      if (logo.size > MAX_LOGO_BYTES) throw new BadRequestException('The logo must be 2 MB or smaller.');
      if (!detectFileType(logo.buffer)?.startsWith('image/')) throw new BadRequestException('The logo must be a PNG, JPEG, WebP or GIF image.');
      [{ url: logoUrl }] = await this.storage.upload([logo], 'previews');
    }

    const preview = await this.previews.save(
      this.previews.create({
        ...dto,
        tagline: dto.tagline ?? '',
        description: dto.description ?? '',
        services: (dto.services ?? []).filter(Boolean),
        phone: dto.phone ?? '',
        city: dto.city ?? '',
        logo_url: logoUrl,
      }),
    );

    const adminEmail = this.config.get<string>('ADMIN_EMAIL');
    if (adminEmail) {
      await this.mail.trySend({
        to: adminEmail,
        subject: `New website preview: ${preview.company_name} (${preview.industry})`,
        template: 'enquiry',
        replyTo: preview.email,
        data: {
          enquiryId: preview.id,
          name: preview.contact_name,
          email: preview.email,
          phone: preview.phone,
          company: preview.company_name,
          message: [
            `Previewed the "${preview.industry}" website template.`,
            preview.tagline && `Tagline: ${preview.tagline}`,
            preview.services.length ? `Services: ${preview.services.join(', ')}` : '',
            preview.city && `City: ${preview.city}`,
          ]
            .filter(Boolean)
            .join('\n'),
          timestamp: preview.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST',
          adminUrl: this.urls.admin,
        },
      });
    }
    return { id: preview.id };
  }

  /** What the website renders. Counts the view. */
  async findPublic(id: string): Promise<PublicSitePreview> {
    const preview = await this.findOne(id);
    await this.previews.update(id, { view_count: () => 'view_count + 1', last_viewed_at: new Date() });
    return Object.fromEntries(PUBLIC_FIELDS.map((key) => [key, preview[key]])) as PublicSitePreview;
  }

  findAll(query: SitePreviewQueryDto): Promise<ListResult<SitePreview>> {
    const qb = this.previews.createQueryBuilder('p').orderBy('p.createdAt', 'DESC');
    if (query.contacted) qb.andWhere('p.is_contacted = :contacted', { contacted: query.contacted === 'true' });
    if (query.industry) qb.andWhere('p.industry = :industry', { industry: query.industry });
    return paginate(applySearch(qb, ['p.company_name', 'p.contact_name', 'p.email', 'p.phone', 'p.city'], query.search), query);
  }

  async findOne(id: string) {
    const preview = await this.previews.findOneBy({ id });
    if (!preview) throw new NotFoundException('Preview not found.');
    return preview;
  }

  async update(id: string, dto: UpdateSitePreviewDto) {
    const preview = await this.findOne(id);
    return this.previews.save(Object.assign(preview, dto));
  }

  /** Deletes the request and its uploaded logo. */
  async remove(id: string) {
    const preview = await this.findOne(id);
    await this.previews.remove(preview);
    await this.storage.removeQuietly([preview.logo_url]);
  }

  async countByContacted() {
    const [contacted, total] = await Promise.all([this.previews.countBy({ is_contacted: true }), this.previews.count()]);
    return { contacted, uncontacted: total - contacted, total };
  }
}
