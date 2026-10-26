import { Column, Entity, Index } from 'typeorm';
import { TimestampedEntity } from '../../common/base.entity';

export interface BlogSection {
  heading?: string;
  content?: string;
  image?: string;
}

@Entity('blogs')
export class Blog extends TimestampedEntity {
  @Index('blogs_name_idx')
  @Column()
  blog_name: string;

  @Column('text', { array: true, default: '{}' })
  blog_images: string[];

  @Column({ type: 'varchar', length: 250 })
  short_description: string;

  @Column({ type: 'jsonb', default: [] })
  blog_descriptions: BlogSection[];

  @Index('blogs_active_idx')
  @Column({ default: true })
  is_active: boolean;
}
