import { Column, Entity, Index, JoinColumn, ManyToOne, Relation } from 'typeorm';
import { TimestampedEntity } from '../../common/base.entity';
import { Project } from '../../projects/entities/project.entity';

export interface WorkSection {
  heading: string;
  details: string;
  img: string;
}

@Entity('works')
export class Work extends TimestampedEntity {
  @Index('works_title_idx')
  @Column({ length: 100 })
  title: string;

  @Column({ type: 'jsonb', default: [] })
  info: WorkSection[];

  @Index('works_project_idx')
  @Column('uuid', { nullable: true })
  project_id?: string | null;

  @ManyToOne(() => Project, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'project_id', foreignKeyConstraintName: 'works_project_id_fkey' })
  project?: Relation<Project> | null;

  @Index('works_active_idx')
  @Column({ default: true })
  is_active: boolean;
}
