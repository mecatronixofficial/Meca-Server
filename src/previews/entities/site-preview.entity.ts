import { Column, Entity, Index } from 'typeorm';
import { TimestampedEntity } from '../../common/base.entity';

/**
 * A visitor's "preview your own website" request: their brand details rendered into an
 * industry template on the public site. Doubles as a sales lead for the admin panel.
 */
@Entity('site_previews')
export class SitePreview extends TimestampedEntity {
  @Column({ type: 'varchar', length: 120 })
  company_name: string;

  /** Template slug, e.g. `medical`, `saas` (see PREVIEW_INDUSTRIES). */
  @Index('site_previews_industry_idx')
  @Column({ type: 'varchar', length: 40 })
  industry: string;

  @Column({ type: 'varchar', length: 160, default: '' })
  tagline: string;

  @Column({ type: 'varchar', length: 600, default: '' })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  logo_url?: string | null;

  /** Hex colour, e.g. `#e10600`. */
  @Column({ type: 'varchar', length: 7 })
  brand_color: string;

  @Column('text', { array: true, default: '{}' })
  services: string[];

  @Column({ type: 'varchar', length: 100 })
  contact_name: string;

  @Index('site_previews_email_idx')
  @Column({ type: 'varchar', length: 254 })
  email: string;

  @Column({ type: 'varchar', length: 30, default: '' })
  phone: string;

  @Column({ type: 'varchar', length: 100, default: '' })
  city: string;

  @Column({ type: 'int', default: 0 })
  view_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_viewed_at?: Date | null;

  @Index('site_previews_contacted_idx')
  @Column({ default: false })
  is_contacted: boolean;

  /** Internal notes from the team. */
  @Column({ type: 'varchar', length: 1000, default: '' })
  notes: string;
}
