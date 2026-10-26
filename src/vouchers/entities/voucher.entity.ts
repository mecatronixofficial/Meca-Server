import { Column, Entity, Index } from 'typeorm';
import { TimestampedEntity } from '../../common/base.entity';

@Entity('vouchers')
export class Voucher extends TimestampedEntity {
  @Index('vouchers_title_idx')
  @Column()
  title: string;

  @Column('text', { array: true, default: '{}' })
  img: string[];

  @Column('text', { array: true, default: '{}' })
  heading: string[];

  @Column('text', { array: true, default: '{}' })
  msg: string[];
}
