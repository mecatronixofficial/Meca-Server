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

  /** Short label above the title, e.g. "New launch". */
  @Column({ type: 'varchar', length: 40, nullable: true })
  tag: string | null;

  /** Up to four short points shown with the banner. */
  @Column('text', { array: true, default: () => "'{}'" })
  highlights: string[];

  /** Optional button: its text and where it goes (a site path like /contact, or a full URL). */
  @Column({ type: 'varchar', length: 40, nullable: true })
  cta_label: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  cta_link: string | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  time: Date;

  @Index('banners_active_idx')
  @Column({ default: true })
  is_active: boolean;
}
