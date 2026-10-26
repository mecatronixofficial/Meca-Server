import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { applySearch, ListResult, paginate } from '../common/pagination';
import { MailService } from '../mail/mail.service';
import { InvoiceQueryDto, SaveInvoiceDto } from './dto/invoice.dto';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { calculateInvoice } from './invoice-totals';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice) private readonly invoices: Repository<Invoice>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: SaveInvoiceDto) {
    await this.assertNumberFree(dto.invoiceNo);
    return this.invoices.save(this.invoices.create(this.toEntity(dto)));
  }

  findAll(query: InvoiceQueryDto): Promise<ListResult<Invoice>> {
    const qb = this.invoices.createQueryBuilder('i').orderBy('i.createdAt', 'DESC');
    if (query.status) qb.andWhere('i.status = :status', { status: query.status });
    return paginate(applySearch(qb, ['i.invoiceNo', 'i.clientName', 'i.clientEmail'], query.search), query);
  }

  async findOne(id: string) {
    const invoice = await this.invoices.findOneBy({ id });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async update(id: string, dto: SaveInvoiceDto) {
    const invoice = await this.findOne(id);
    await this.assertNumberFree(dto.invoiceNo, id);
    return this.invoices.save(Object.assign(invoice, this.toEntity(dto)));
  }

  async markBillGenerated(id: string) {
    const invoice = await this.findOne(id);
    return this.invoices.save(Object.assign(invoice, { status: InvoiceStatus.BILL_GENERATED, billGeneratedAt: new Date() }));
  }

  async markWhatsappSent(id: string) {
    const invoice = await this.findOne(id);
    return this.markSent(invoice, 'whatsapp');
  }

  async sendEmail(id: string) {
    const invoice = await this.findOne(id);
    if (!invoice.clientEmail) throw new BadRequestException('Client email is required');

    await this.mail.send({
      to: invoice.clientEmail,
      subject: `Invoice ${invoice.invoiceNo} from Mecatronix`,
      template: 'invoice',
      data: {
        invoice,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate ?? '',
        total: invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        adminUrl: this.config.get<string>('ADMIN_URL') ?? '',
      },
    });
    return this.markSent(invoice, 'email');
  }

  async remove(id: string) {
    await this.invoices.remove(await this.findOne(id));
  }

  private markSent(invoice: Invoice, channel: 'email' | 'whatsapp') {
    invoice.status = InvoiceStatus.SENT;
    invoice.sentAt = new Date();
    invoice.sentBy = { email: !!invoice.sentBy?.email, whatsapp: !!invoice.sentBy?.whatsapp, [channel]: true };
    return this.invoices.save(invoice);
  }

  private toEntity(dto: SaveInvoiceDto): Partial<Invoice> {
    const { items, subtotal, total } = calculateInvoice(dto.items);
    if (!items.length) throw new BadRequestException('At least one invoice item is required');
    return {
      invoiceNo: dto.invoiceNo,
      invoiceDate: dto.invoiceDate,
      dueDate: dto.dueDate || null,
      clientName: dto.clientName,
      clientEmail: dto.clientEmail ?? '',
      clientPhone: dto.clientPhone ?? '',
      items,
      subtotal,
      total,
      pageCount: dto.pageCount ?? 1,
      notes: dto.notes ?? '',
    };
  }

  private async assertNumberFree(invoiceNo: string, excludingId?: string) {
    const taken = await this.invoices.existsBy(excludingId ? { invoiceNo, id: Not(excludingId) } : { invoiceNo });
    if (taken) throw new ConflictException('Invoice number already exists');
  }
}
