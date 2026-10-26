import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AppUrls } from '../common/app-urls';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { applySearch, ListQueryDto, ListResult, paginate } from '../common/pagination';
import { MailService } from '../mail/mail.service';
import { NewslettersService } from '../newsletters/newsletters.service';
import { CreateVoucherDto } from './dto/voucher.dto';
import { Voucher } from './entities/voucher.entity';

@Injectable()
export class VouchersService {
  private readonly logger = new Logger(VouchersService.name);

  constructor(
    @InjectRepository(Voucher) private readonly vouchers: Repository<Voucher>,
    private readonly newsletters: NewslettersService,
    private readonly mail: MailService,
    private readonly urls: AppUrls,
  ) {}

  /** Saves the voucher and emails it to every newsletter subscriber. */
  async create(dto: CreateVoucherDto) {
    const voucher = await this.vouchers.save(this.vouchers.create({ ...dto, img: dto.img ?? [], heading: dto.heading ?? [] }));
    const recipients = await this.newsletters.emails();
    if (!recipients.length) return { voucher, delivery: { sent: 0, failed: 0 } };

    const delivery = await this.mail.sendMany(
      recipients.map((to) => ({
        to,
        subject: `${voucher.title} - MECATRONIX Update`,
        template: 'voucher' as const,
        data: {
          title: voucher.title,
          heading: voucher.heading[0] ?? '',
          message: voucher.msg[0] ?? '',
          images: voucher.img,
          websiteUrl: this.urls.website,
          unsubscribeUrl: this.newsletters.unsubscribeUrl(to),
        },
        headers: this.newsletters.unsubscribeHeaders(to),
      })),
    );
    this.logger.log(`Voucher "${voucher.title}" emailed: ${delivery.sent} sent, ${delivery.failed} failed`);
    return { voucher, delivery };
  }

  findAll(query: ListQueryDto): Promise<ListResult<Voucher>> {
    const qb = this.vouchers.createQueryBuilder('v').orderBy('v.createdAt', 'DESC');
    return paginate(applySearch(qb, ['v.title'], query.search), query);
  }

  async findOne(id: string) {
    const voucher = await this.vouchers.findOneBy({ id });
    if (!voucher) throw new NotFoundException('Voucher not found');
    return voucher;
  }

  async remove(id: string) {
    await this.vouchers.remove(await this.findOne(id));
  }
}
