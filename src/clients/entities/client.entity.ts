import { Column, Entity, Index } from 'typeorm';
import { TimestampedEntity } from '../../common/base.entity';

export interface Company {
  name: string;
  img: string;
  url: string;
  industry: string;
  year: number;
}

@Entity('clients')
// GIN index used by review verification (`companies @> ...`); managed by migrations only.
@Index('clients_companies_gin', { synchronize: false })
export class Client extends TimestampedEntity {
  @Index('clients_name_idx')
  @Column()
  client_name: string;

  @Column({ type: 'jsonb', default: [] })
  companies: Company[];

  @Column('text', { array: true, default: '{}' })
  client_emails: string[];

  @Column('text', { array: true, default: '{}' })
  client_phones: string[];

  @Index('clients_active_idx')
  @Column({ default: true })
  is_active: boolean;
}
