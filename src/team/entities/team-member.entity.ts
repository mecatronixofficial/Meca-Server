import { Check, Column, Entity, Index } from 'typeorm';
import { TimestampedEntity } from '../../common/base.entity';

/** A founder or team member shown on the website's About page. */
@Entity('team_members')
@Index('team_members_order_idx', ['position', 'createdAt'])
@Check('"position" > 0')
export class TeamMember extends TimestampedEntity {
  @Column({ length: 100 })
  name: string;

  /** Title shown under the name, e.g. "Founder & CEO". */
  @Column({ length: 80 })
  role: string;

  @Column({ type: 'varchar', length: 600, default: '' })
  bio: string;

  @Column()
  photo: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  linkedin: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  /** Display order: 1 shows first. */
  @Column('integer', { default: 1 })
  position: number;

  @Column({ default: true })
  is_active: boolean;
}
