import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export interface Screenshot { src: string; alt: string }
export interface ProjectVideo { src: string; title: string; poster?: string }

@Entity('project_media')
export class ProjectMedia {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  slug: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  images: Screenshot[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  videos: ProjectVideo[];

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

