import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Key/value website settings edited in the admin panel, e.g. `contact`. One row per key. */
@Entity('site_settings')
export class SiteSetting {
  @PrimaryColumn({ type: 'varchar', length: 60 })
  key: string;

  @Column({ type: 'jsonb' })
  value: unknown;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
