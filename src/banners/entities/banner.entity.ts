import { Check, Column, Entity, Index, Unique } from 'typeorm';
import { TimestampedEntity } from '../../common/base.entity';

@Entity('banners')
@Unique('banners_position_key', ['position'])
@Check('banners_position_check', '"position" > 0')
export class Banner extends TimestampedEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column()
  img: string;

  @Column('integer')
  position: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  time: Date;

  @Index('banners_active_idx')
  @Column({ default: true })
  is_active: boolean;
}
