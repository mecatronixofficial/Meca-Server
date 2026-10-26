import { Check, Column, Entity, Index } from 'typeorm';
import { TimestampedEntity } from '../../common/base.entity';

@Entity('reviews')
@Check('reviews_rating_check', '"rating" >= 1 AND "rating" <= 5')
export class Review extends TimestampedEntity {
  @Column()
  user_name: string;

  @Index('reviews_email_idx')
  @Column()
  user_email: string;

  @Column({ default: '' })
  company_name: string;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'varchar', length: 500, default: '' })
  comment: string;

  @Index('reviews_verified_idx')
  @Column({ default: false })
  is_verified: boolean;
}
