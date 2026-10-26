import { Column, Entity, Index, JoinColumn, ManyToOne, Relation } from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { TimestampedEntity } from '../../common/base.entity';
import { Work } from '../../works/entities/work.entity';

@Entity('projects')
export class Project extends TimestampedEntity {
  @Index('projects_name_idx')
  @Column()
  project_name: string;

  @Column()
  project_image: string;

  @Column({ type: 'varchar', length: 250 })
  short_description: string;

  @Column()
  project_url: string;

  @Index('projects_client_idx')
  @Column('uuid')
  client_id: string;

  @ManyToOne(() => Client, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id', foreignKeyConstraintName: 'projects_client_id_fkey' })
  client?: Relation<Client>;

  @Index('projects_work_idx')
  @Column('uuid', { nullable: true })
  work_id?: string | null;

  @ManyToOne(() => Work, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'work_id', foreignKeyConstraintName: 'projects_work_fk' })
  work?: Relation<Work> | null;

  @Index('projects_active_idx')
  @Column({ default: true })
  is_active: boolean;
}
