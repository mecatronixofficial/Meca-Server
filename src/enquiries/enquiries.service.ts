import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUrls } from '../common/app-urls';
import { applySearch, ListResult, paginate } from '../common/pagination';
import { MailService } from '../mail/mail.service';
import { CreateEnquiryDto, EnquiryQueryDto, UpdateEnquiryDto } from './dto/enquiry.dto';
import { Enquiry } from './entities/enquiry.entity';

@Injectable()
export class EnquiriesService {
  constructor(
    @InjectRepository(Enquiry) private readonly enquiries: Repository<Enquiry>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly urls: AppUrls,
  ) {}

  /** Saves the enquiry, then notifies the team and acknowledges the sender. Email failures do not fail the request. */
  async create({ company, ...dto }: CreateEnquiryDto) {
    const enquiry = await this.enquiries.save(
      this.enquiries.create({
        ...dto,
        name: dto.name ?? '',
        phone: dto.phone ?? '',
        company_name: dto.company_name ?? company ?? '',
        is_opened: false,
      }),
    );

    const details = {
      enquiryId: enquiry.id,
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone,
      company: enquiry.company_name,
      message: enquiry.message,
      timestamp: enquiry.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST',
      adminUrl: this.urls.admin,
    };
    const adminEmail = this.config.get<string>('ADMIN_EMAIL');
    await Promise.all([
      adminEmail &&
        this.mail.trySend({
          to: adminEmail,
          subject: `New Enquiry from ${enquiry.name || enquiry.email}`,
          template: 'enquiry',
          data: details,
          replyTo: enquiry.email,
        }),
      this.mail.trySend({ to: enquiry.email, subject: 'Thanks for contacting Mecatronix!', template: 'enquiryUser', data: details }),
    ]);
    return enquiry;
  }

  findAll(query: EnquiryQueryDto): Promise<ListResult<Enquiry>> {
    const qb = this.enquiries.createQueryBuilder('e').orderBy('e.createdAt', 'DESC');
    if (query.opened) qb.andWhere('e.is_opened = :opened', { opened: query.opened === 'true' });
    return paginate(applySearch(qb, ['e.name', 'e.email', 'e.company_name', 'e.message'], query.search), query);
  }

  /** Reading an enquiry marks it as opened the first time. */
  async open(id: string) {
    const enquiry = await this.findOne(id);
    if (enquiry.is_opened) return enquiry;
    return this.enquiries.save(Object.assign(enquiry, { is_opened: true, opened_at: new Date() }));
  }

  async update(id: string, dto: UpdateEnquiryDto) {
    const enquiry = await this.findOne(id);
    if (dto.is_opened !== undefined && dto.is_opened !== enquiry.is_opened) enquiry.opened_at = dto.is_opened ? new Date() : null;
    return this.enquiries.save(Object.assign(enquiry, dto));
  }

  async remove(id: string) {
    await this.enquiries.remove(await this.findOne(id));
  }

  async countByOpened() {
    const [opened, total] = await Promise.all([this.enquiries.countBy({ is_opened: true }), this.enquiries.count()]);
    return { opened, unopened: total - opened, total };
  }

  private async findOne(id: string) {
    const enquiry = await this.enquiries.findOneBy({ id });
    if (!enquiry) throw new NotFoundException('Enquiry not found.');
    return enquiry;
  }
}
