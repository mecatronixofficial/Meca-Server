import { Column, Entity, Index } from 'typeorm';
import { TimestampedEntity } from '../../common/base.entity';

@Entity('enquiries')
export class Enquiry extends TimestampedEntity {
  @Column()
  name: string;

  @Index('enquiries_email_idx')
  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ default: '' })
  company_name: string;

  @Column({ type: 'varchar', length: 1000 })
  message: string;

  @Index('enquiries_opened_idx')
  @Column({ default: false })
  is_opened: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  opened_at?: Date | null;
}
