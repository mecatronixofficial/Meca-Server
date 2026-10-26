import { Column, Entity, Index, Unique, ValueTransformer } from 'typeorm';
import { TimestampedEntity } from '../../common/base.entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  BILL_GENERATED = 'bill_generated',
  SENT = 'sent',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export interface InvoiceItem {
  desc: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface InvoiceSentBy {
  email: boolean;
  whatsapp: boolean;
}

/** PostgreSQL returns NUMERIC as a string; expose it as a number. */
const numeric: ValueTransformer = { to: (value?: number) => value, from: (value?: string | null) => (value == null ? 0 : Number(value)) };

@Entity('invoices')
@Unique('invoices_invoiceNo_key', ['invoiceNo'])
// Descending index for the newest-first list; managed by migrations only.
@Index('invoices_created_idx', { synchronize: false })
export class Invoice extends TimestampedEntity {
  @Column()
  invoiceNo: string;

  @Index('invoices_date_idx')
  @Column({ type: 'date' })
  invoiceDate: string;

  @Column({ type: 'date', nullable: true })
  dueDate?: string | null;

  @Column()
  clientName: string;

  @Index('invoices_client_email_idx')
  @Column({ default: '' })
  clientEmail: string;

  @Column({ default: '' })
  clientPhone: string;

  @Column({ type: 'jsonb', default: [] })
  items: InvoiceItem[];

  @Column({ type: 'integer', default: 1 })
  pageCount: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0, transformer: numeric })
  subtotal: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0, transformer: numeric })
  total: number;

  @Index('invoices_status_idx')
  @Column({ type: 'varchar', default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ type: 'timestamptz', nullable: true })
  billGeneratedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt?: Date | null;

  @Column({ type: 'jsonb', default: { email: false, whatsapp: false } })
  sentBy: InvoiceSentBy;

  @Column({ type: 'text', default: '' })
  notes: string;
}
